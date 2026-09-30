/**
 * Scan of public MCP servers (FR-062, D-024, R-17). It builds and starts code we did not write,
 * so the owner starts it, with a candidate list kept outside the repo:
 *
 *   npx tsx scripts/scan/scan.ts --list <candidates.json> [--only <id>] [--out <dir>]
 *
 * Each candidate is cloned at its pinned commit, built in a container (network only while
 * installing) and started on an internal Docker network with no way out: no host mounts, no
 * credentials, all capabilities dropped. A small proxy container is the only way in, on
 * 127.0.0.1. Hearsay lints `tools/list`; in `calls` mode it also calls read-only tools that need
 * no arguments, once each, and judges them with the engine's own checks. Server logs are searched
 * for attempts to reach the network. Results carry names and stay in --out, outside the repo;
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
const BASE = { node: 'node:22-slim', python: 'python:3.12-slim' } as const;

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
    if (c.local) cpSync(c.local, join(dir, 'src'), { recursive: true, filter: (p) => !p.includes('/node_modules') });
    else {
      execFileSync('git', ['clone', '--quiet', `https://github.com/${c.repo}.git`, join(dir, 'src')], { stdio: 'ignore', timeout: 300_000 });
      execFileSync('git', ['-C', join(dir, 'src'), 'checkout', '--quiet', c.sha!], { stdio: 'ignore' });
    }
    row.stage = 'build';
    const work = c.subdir ? `/app/${c.subdir}` : '/app';
    writeFileSync(join(dir, 'Dockerfile'), `FROM ${c.image ?? BASE[c.runtime]}\nWORKDIR /app\nCOPY src/ /app/\nWORKDIR ${work}\nRUN ${c.install}\n`);
    const build = docker(['build', '-q', '-t', tag, dir], 900_000);
    if (build.status !== 0) return { ...row, error: build.stderr.slice(-600) };

    row.stage = 'start';
    docker(['network', 'create', '--internal', net]);
    const env = Object.entries({ PORT: String(c.port), HOST: '0.0.0.0', ...(c.env ?? {}) }).flatMap(([k, v]) => ['-e', `${k}=${v}`]);
    const run = docker(['run', '-d', '--name', srv, '--network', net, '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--memory', '1g', '--pids-limit', '512', '--tmpfs', '/tmp', ...env, tag, 'sh', '-c', c.start]);
    if (run.status !== 0) return { ...row, error: run.stderr.slice(-600) };
    // The only way in: a proxy on 127.0.0.1 that also sits on the internal network, and a forwarder
    // inside the server's own network namespace, because many servers listen on 127.0.0.1 only.
    const forward = (listen: number, host: string, port: number) => `require('net').createServer((a)=>{const b=require('net').connect(${port},'${host}');a.pipe(b).pipe(a);a.on('error',()=>b.destroy());b.on('error',()=>a.destroy())}).listen(${listen},'0.0.0.0')`;
    docker(['run', '-d', '--name', inner, '--network', `container:${srv}`, BASE.node, 'node', '-e', forward(9099, '127.0.0.1', c.port)]);
    docker(['run', '-d', '--name', px, '-p', `127.0.0.1:${hostPort}:8080`, BASE.node, 'node', '-e', forward(8080, srv, 9099)]);
    docker(['network', 'connect', net, px]);
    const url = `http://127.0.0.1:${hostPort}${c.path ?? '/mcp'}`;
    if (!(await answers(url, Date.now() + 120_000))) return { ...row, error: 'did not answer within 120 s', logs: docker(['logs', srv]).stdout.slice(-600) + docker(['logs', srv]).stderr.slice(-600) };

    row.stage = 'lint';
    const lint = await lintServer(url, c.bearer);
    const tools = lint.tools;
    row.started = true;
    row.tools = tools.length;
    row.annotated = tools.filter((t) => t.annotations && ('readOnlyHint' in t.annotations || 'destructiveHint' in t.annotations)).length;
    row.readOnly = tools.filter((t) => t.annotations?.readOnlyHint === true).length;
    row.findings = lint.serverFindings.map(trim);

    if (c.mode === 'calls') {
      row.stage = 'calls';
      const suite = SuiteSchema.parse({ suite: 'scan', server: { url }, orchestrator: 'scripted', cases: [{ id: 'scan', say: 'scan', expect: { tool: 'scan' } }] });
      const session = await McpSession.open({ url, principal: c.bearer ?? newPrincipal(), elicitation: false });
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
    }
    row.stage = 'done';
    return row;
  } catch (e) {
    return { ...row, error: (e as Error).message.slice(0, 600) };
  } finally {
    const logs = docker(['logs', srv]);
    row.outbound = OUTBOUND.test(`${logs.stdout}\n${logs.stderr}`);
    for (const name of [px, inner, srv]) docker(['rm', '-f', name]);
    docker(['network', 'rm', net]);
    docker(['image', 'rm', '-f', tag]);
  }
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
