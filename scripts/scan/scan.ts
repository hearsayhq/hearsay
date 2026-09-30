/**
 * Scan of public MCP servers (FR-062, D-024, R-17). It builds and starts code we did not write,
 * so the owner starts it, with a candidate list kept outside the repo:
 *
 *   npx tsx scripts/scan/scan.ts --list <candidates.json> [--only <id>] [--out <dir>]
 *
 * Each candidate is cloned at its pinned commit, built in a container (network only while
 * installing) and started on an internal Docker network with no way out: no host mounts, no
 * credentials, all capabilities dropped. A small proxy container is the only way in, on
 * 127.0.0.1. Hearsay lints `tools/list` and calls no tool in `list` mode; in `calls` mode the lint
 * probe reads each read-only tool without arguments twice, and the scan calls it once more and
 * judges the reply with the engine's own checks. Server logs are searched for attempts to reach
 * the network. Results carry names and stay in --out, outside the repo;
 * scripts/scan/aggregate.ts writes docs/16 without them.
 *
 * Candidate: { id, repo?, sha?, local?, group: "A"|"B"|"C"|"E", mode: "calls"|"list",
 *              runtime: "node"|"python", image?, install, start, port, path?, subdir?, env?,
 *              bearer? (sent as the bearer token, for servers that require one) }
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { lintServer, McpSession, newPrincipal, SuiteSchema, type Finding } from '../../packages/engine/src/index';
import { TURN_CHECKS } from '../../packages/engine/src/checks/index';
import type { Turn } from '../../packages/engine/src/trace';

interface Candidate {
  id: string;
  repo?: string;
  sha?: string;
  local?: string;
  group: 'A' | 'B' | 'C' | 'E';
  mode: 'calls' | 'list';
  runtime: 'node' | 'python';
  /** Base image when the runtime default does not fit, e.g. node:24-slim. */
  image?: string;
  bearer?: string;
  install: string;
  start: string;
  port: number;
  path?: string;
  subdir?: string;
  env?: Record<string, string>;
}

const REPO = resolve(new URL('../..', import.meta.url).pathname);
const { values: opt } = parseArgs({ options: { list: { type: 'string' }, only: { type: 'string' }, out: { type: 'string' } } });
if (!opt.list) throw new Error('--list <candidates.json> is required (kept outside the repo)');
const OUT = resolve(opt.out ?? join(tmpdir(), 'hearsay-scan'));
if ((OUT + '/').startsWith(REPO + '/')) throw new Error('--out must be outside the repo: results carry names');
const CALL_CHECKS = ['latency.tool', 'speak.no_structured_dump', 'speak.length', 'lint.error_actionable', 'protocol.refusal_as_result'];
const OUTBOUND = /ENOTFOUND|EAI_AGAIN|getaddrinfo|ECONNREFUSED|ENETUNREACH|Temporary failure in name resolution|NameResolutionError|Network is unreachable|Failed to resolve/i;
const LOOPBACK = /127\.0\.0\.1|localhost|::1|0\.0\.0\.0/;
const BASE = { node: 'node:22-slim', python: 'python:3.12-slim' } as const;

/** A TCP forwarder as a one-line Node program; with `host`, requests get that Host header. */
const forward = (listen: number, to: string, port: number, host?: string) =>
  `const net=require('net');net.createServer((a)=>{const b=net.connect(${port},'${to}');` +
  (host ? `a.on('data',(d)=>b.write(Buffer.from(d.toString('latin1').replace(/\\r\\nhost:[^\\r\\n]*/gi,'\\r\\nHost: ${host}'),'latin1')));a.on('end',()=>b.end());` : `a.pipe(b);`) +
  `b.pipe(a);a.on('error',()=>b.destroy());b.on('error',()=>a.destroy())}).listen(${listen},'0.0.0.0')`;

const docker = (args: string[], timeoutMs = 60_000) => spawnSync('docker', args, { encoding: 'utf8', timeout: timeoutMs });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const trim = (f: Finding) => ({ checkId: f.checkId, severity: f.severity, question: f.question, message: f.message.slice(0, 200) });

async function answers(url: string, deadlineMs: number): Promise<boolean> {
  while (Date.now() < deadlineMs) {
    try {
      await fetch(url, { method: 'GET', signal: AbortSignal.timeout(1500) });
      return true;
    } catch {
      await sleep(1000);
    }
  }
  return false;
}

async function scan(c: Candidate, hostPort: number): Promise<Record<string, unknown>> {
  const dir = join(OUT, c.id);
  const tag = `hearsay-scan-${c.id}`;
  const net = `${tag}-net`;
  const srv = `${tag}-srv`;
  const px = `${tag}-px`;
  const inner = `${tag}-in`;
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const row: Record<string, unknown> = { id: c.id, repo: c.repo ?? c.local, sha: c.sha, group: c.group, mode: c.mode, stage: 'clone' };
  try {
    row.error = await steps(c, row, { dir, tag, net, srv, px, inner, hostPort });
    if (!row.error) row.stage = 'done';
  } catch (e) {
    row.error = (e as Error).message.slice(0, 600);
  } finally {
    const logs = docker(['logs', srv]);
    const lines = `${logs.stdout}\n${logs.stderr}`.split('\n');
    // Loopback errors are a server looking for its own database or sidecar, not the network.
    const network = lines.filter((l) => OUTBOUND.test(l) && !LOOPBACK.test(l)).map((l) => l.trim().slice(0, 200));
    row.outbound = network.length > 0;
    if (network.length) row.outboundLines = network.slice(0, 3);
    if (row.error) row.logs = lines.join('\n').slice(-800);
    for (const name of [px, inner, srv]) docker(['rm', '-f', name]);
    docker(['network', 'rm', net]);
    docker(['image', 'rm', '-f', tag]);
  }
  if (row.error === undefined) delete row.error;
  return row;
}

interface Names { dir: string; tag: string; net: string; srv: string; px: string; inner: string; hostPort: number }

/** Builds, starts and scans one candidate; returns an error message, or undefined when it got through. */
async function steps(c: Candidate, row: Record<string, unknown>, n: Names): Promise<string | undefined> {
  if (c.local) cpSync(c.local, join(n.dir, 'src'), { recursive: true, filter: (p) => !p.includes('/node_modules') });
  else {
    execFileSync('git', ['clone', '--quiet', `https://github.com/${c.repo}.git`, join(n.dir, 'src')], { stdio: 'ignore', timeout: 300_000 });
    execFileSync('git', ['-C', join(n.dir, 'src'), 'checkout', '--quiet', c.sha!], { stdio: 'ignore' });
  }
  row.stage = 'build';
  const work = c.subdir ? `/app/${c.subdir}` : '/app';
  writeFileSync(join(n.dir, 'Dockerfile'), `FROM ${c.image ?? BASE[c.runtime]}\nWORKDIR /app\nCOPY src/ /app/\nWORKDIR ${work}\nRUN ${c.install}\n`);
  const build = docker(['build', '-q', '-t', n.tag, n.dir], 900_000);
  if (build.status !== 0) return build.stderr.slice(-600);

  row.stage = 'start';
  docker(['network', 'create', '--internal', n.net]);
  const env = Object.entries({ PORT: String(c.port), HOST: '0.0.0.0', ...(c.env ?? {}) }).flatMap(([k, v]) => ['-e', `${k}=${v}`]);
  const run = docker(['run', '-d', '--name', n.srv, '--network', n.net, '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--memory', '1g', '--pids-limit', '512', '--tmpfs', '/tmp', ...env, n.tag, 'sh', '-c', c.start]);
  if (run.status !== 0) return run.stderr.slice(-600);
  // The only way in: a proxy on 127.0.0.1 that also sits on the internal network, and a forwarder
  // inside the server's own network namespace, because many servers listen on 127.0.0.1 only. The
  // forwarder sets Host to the server's own address, as a client started next to it would send;
  // servers that guard against DNS rebinding refuse any other port.
  docker(['run', '-d', '--name', n.inner, '--network', `container:${n.srv}`, BASE.node, 'node', '-e', forward(9099, '127.0.0.1', c.port, `127.0.0.1:${c.port}`)]);
  docker(['run', '-d', '--name', n.px, '-p', `127.0.0.1:${n.hostPort}:8080`, BASE.node, 'node', '-e', forward(8080, n.srv, 9099)]);
  docker(['network', 'connect', n.net, n.px]);
  const url = `http://127.0.0.1:${n.hostPort}${c.path ?? '/mcp'}`;
  if (!(await answers(url, Date.now() + 120_000))) return 'did not answer within 120 s';

  // No bearer unless the candidate needs one: a random token makes servers that verify tokens refuse.
  const principal = c.bearer ?? '';
  row.stage = 'lint';
  const lint = await lintServer(url, { principal, callTools: c.mode === 'calls' });
  const tools = lint.tools;
  row.started = true;
  row.tools = tools.length;
  row.annotated = tools.filter((t) => t.annotations && ('readOnlyHint' in t.annotations || 'destructiveHint' in t.annotations)).length;
  row.readOnly = tools.filter((t) => t.annotations?.readOnlyHint === true).length;
  row.findings = lint.serverFindings.map(trim);
  if (c.mode !== 'calls') return undefined;

  row.stage = 'calls';
  const suite = SuiteSchema.parse({ suite: 'scan', server: { url }, orchestrator: 'scripted', cases: [{ id: 'scan', say: 'scan', expect: { tool: 'scan' } }] });
  const session = await McpSession.open({ url, principal, elicitation: false });
  const calls = [];
  try {
    const eligible = tools.filter((t) => t.annotations?.readOnlyHint === true && !((t.inputSchema as { required?: string[] }).required ?? []).length);
    for (const t of eligible) {
      const call = await Promise.race([session.callTool(t.name, {}), sleep(10_000).then(() => undefined)]);
      if (!call) {
        calls.push({ tool: t.name, timeout: true });
        continue;
      }
      const turn: Turn = { id: `scan#${t.name}`, utterance: '', heard: '', spans: [{ kind: 'tool', name: t.name, startMs: 0, endMs: call.latencyMs }], toolCalls: [{ tool: t.name, args: {}, result: call.result, latencyMs: call.latencyMs }], elicitations: [], spoken: call.result.text, toolListRevision: 0 };
      const trace = { suite: 'scan', caseId: 'scan', variant: 'clean', orchestrator: 'scripted', principal: 'scan', client: { elicitation: false }, server: session.serverInfo(), turns: [turn], startedAt: '' } as never;
      const found = CALL_CHECKS.flatMap((id) => TURN_CHECKS.get(id)?.run({ suite, case: suite.cases[0]!, trace, turns: [turn], tools }) ?? []);
      calls.push({ tool: t.name, ms: Math.round(call.latencyMs), isError: call.result.isError, findings: found.map(trim) });
    }
  } finally {
    await session.close();
  }
  row.calls = calls;
  return undefined;
}

const list = (JSON.parse(readFileSync(opt.list, 'utf8')) as Candidate[]).filter((c) => !opt.only || c.id === opt.only);
mkdirSync(OUT, { recursive: true });
let port = 4400;
for (const c of list) {
  const row = await scan(c, port++);
  writeFileSync(join(OUT, `${c.id}.json`), JSON.stringify(row, null, 2));
  console.error(`${c.id} (${c.group}): ${row.stage === 'done' ? `${row.tools} tools, ${(row.findings as unknown[]).length} findings${row.calls ? `, ${(row.calls as unknown[]).length} read-only calls` : ''}` : `stopped at ${row.stage}: ${String(row.error ?? '').split('\n')[0]}`}${row.outbound ? ', tried to reach the network' : ''}`);
}
console.error(`results: ${OUT}`);
