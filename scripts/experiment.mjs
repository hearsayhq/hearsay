#!/usr/bin/env node
/**
 * The agent-loop experiment (FR-065, docs/15): flawed servers × {A: Hearsay MCP + skill,
 * B: task description only} × runs. Each run gets a fresh workspace with only the flawed
 * server (sanitised: no hints, no docs), its locked suite, the kit as a packed copy and, in
 * arm A, the skill. After the run the suites are restored from outside the workspace, the
 * holdout file is copied in, and `hearsay run --holdout` judges the result, scripted.
 *
 *   node scripts/experiment.mjs --dry-run                  judge the untouched flawed servers (free)
 *   node scripts/experiment.mjs [--runs 3] [--first 1] [--servers kitchen,household-orders,smart-home]
 *                               [--arms A,B] [--model sonnet] [--port 4140] [--out dir]
 *   node scripts/experiment.mjs --audit --out dir          list every file access outside each run's workspace
 *   node scripts/experiment.mjs --version v2 [--limit 6]   experiment v2 (docs/15 §v2): v2 builds, holdouts/v2,
 *                                                          arms A, B and Bs (B′: B plus a shell); --limit stops
 *                                                          after that many new runs, so the same command runs the
 *                                                          next block of six
 *
 * Agent runs need the owner's approval. A block is one run index across all servers and arms
 * (`--first 2 --runs 1` = block 2, six runs); rows already in <out>/results.jsonl are skipped, so a
 * block can be resumed. Through a Claude Code subscription `total_cost_usd` is an API-equivalent
 * figure, not a bill; the script refuses to run with ANTHROPIC_API_KEY set and stops when a run
 * reports any other key source than the subscription.
 *
 * Results: build/experiment/<stamp>/results.jsonl and a Markdown table on stdout.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const REPO = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const TSX = join(REPO, 'node_modules/.bin/tsx');
const KIT = join(REPO, 'build/npm/hearsayhq-kit-0.1.0.tgz');
const MCP = join(REPO, 'build/npm/hearsayhq-mcp-0.1.0.tgz');
const { values: opt } = parseArgs({ options: { runs: { type: 'string', default: '3' }, servers: { type: 'string', default: 'smart-home,kitchen,household-orders' }, arms: { type: 'string' }, model: { type: 'string', default: 'sonnet' }, first: { type: 'string', default: '1' }, port: { type: 'string', default: '4140' }, out: { type: 'string' }, version: { type: 'string', default: 'v1' }, limit: { type: 'string' }, 'dry-run': { type: 'boolean' }, audit: { type: 'boolean' } } });
const DRY = !!opt['dry-run'];
const V2 = opt.version === 'v2';
const ARMS = (opt.arms ?? (V2 ? 'A,B,Bs' : 'A,B')).split(',');
const LABEL = { A: 'A', B: 'B', Bs: 'B′', baseline: 'baseline' };
// Outside the repo: a workspace inside it lets an agent walk up into the fixed servers.
const OUT = opt.out ? resolve(opt.out) : join(tmpdir(), 'hearsay-experiment', `${opt.version}-${new Date().toISOString().replace(/[:.]/g, '-')}`);
const HARNESS = join(OUT, '.harness');
if (!opt.audit && (OUT + '/').startsWith(REPO + '/')) throw new Error(`--out must be outside the repo (${REPO}): agents could read the fixed servers from there`);

/** Per server: which files form the add-on, and how it starts. */
const SERVERS = {
  'smart-home': {
    files: { 'devices.ts': 'devices.ts', 'flawed.ts': 'server.ts' },
    rename: ['createFlawedServer', 'createServer'],
    v2: { file: 'flawed-v2.ts', rename: ['createSmartHomeServerV2', 'createServer'] },
    index: `import { serveMcp } from '@hearsayhq/kit';\nimport { Home } from './devices';\nimport { createServer } from './server';\n\nconst home = new Home();\nawait serveMcp({ port: Number(process.env.PORT), create: (ctx) => createServer(home, ctx) });\n`,
    what: 'scenes for every room of a smart home',
  },
  kitchen: {
    files: { 'timers.ts': 'timers.ts', 'recipe.ts': 'recipe.ts', 'flawed.ts': 'server.ts' },
    rename: ['createFlawedKitchenServer', 'createServer'],
    v2: { file: 'flawed-v2.ts', rename: ['createKitchenServerV2', 'createServer'] },
    index: `import { serveMcp } from '@hearsayhq/kit';\nimport { createServer } from './server';\nimport { TimerStore } from './timers';\n\nconst store = new TimerStore();\nawait serveMcp({ port: Number(process.env.PORT), create: (ctx) => createServer(store, ctx) });\n`,
    what: 'kitchen timers and the steps of a recipe',
  },
  'household-orders': {
    files: { 'catalog.ts': 'catalog.ts', 'store.ts': 'store.ts', 'common.ts': 'common.ts', 'flawed.ts': 'server.ts' },
    rename: ['createFlawedHouseholdServer', 'createServer'],
    v2: { file: 'flawed-v2.ts', rename: ['createHouseholdServerV2', 'createServer'] },
    index: `import { serveMcp, VerbalTokens } from '@hearsayhq/kit';\nimport { tokenTtl, type Shared } from './common';\nimport { createServer } from './server';\nimport { Store } from './store';\n\nconst shared: Shared = { store: new Store(), tokens: new VerbalTokens({ ttlSeconds: tokenTtl() }), pending: new Map(), now: Date.now };\nawait serveMcp({ port: Number(process.env.PORT), create: (ctx) => createServer(shared, ctx) });\n`,
    what: 'grocery reorders within a spending permission the person grants',
  },
};

const PROMPT = {
  A: (s) => `This repository is the MCP server of an Alexa+ add-on (src/): ${SERVERS[s].what}. Make it pass its Hearsay suite, suites/${s}.yaml. Use the fix-hearsay-findings skill and the hearsay tools.`,
  B: (s) => `This repository is the MCP server of an Alexa+ add-on (src/): ${SERVERS[s].what}. Make it work well behind a voice assistant: replies are spoken, a person may be misheard, and money must only move on the person's confirmation. suites/${s}.yaml describes what should happen. Change the server code only.`,
  Bs: (s) => `${PROMPT.B(s)} You can use the shell to run the server and try it.`,
};
const TOOLS = { A: ['mcp__hearsay__hearsay_run', 'mcp__hearsay__hearsay_lint', 'mcp__hearsay__hearsay_explain', 'Read', 'Edit', 'Write', 'Glob', 'Grep', 'Skill'], B: ['Read', 'Edit', 'Write', 'Glob', 'Grep'], Bs: ['Read', 'Edit', 'Write', 'Glob', 'Grep', 'Bash'] };

/** No hints in the workspace: file headers, comments that name checks or decisions, "flawed". */
function sanitise(code, rename) {
  let s = code.replace(/^\/\*\*[\s\S]*?\*\/\n/, '').replace(/^.*\/\/.*(mandate\.injection|D-0\d\d|docs\/).*\n/gm, '').replace(/ Keyed by principal \(D-009\), or by session in flawed mode\./, '').replace(/0\.1\.0-flawed/g, '0.1.0').replace(/^\s*(\/\/|\/\*\*).*flaw.*\n/gim, '').replace(/[ \t]*\/\/[^\n]*flaw[^\n]*/gi, '').replace(/\s*\(D-0\d\d\)/g, '');
  if (rename) s = s.replaceAll(rename[0], rename[1]);
  if (/flaw/i.test(s)) throw new Error(`sanitise left a hint: ${s.split('\n').find((l) => /flaw/i.test(l))}`);
  return s;
}

const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
const hashes = (dir) => Object.fromEntries(readdirSync(dir).filter((f) => !f.includes('holdout')).map((f) => [f, sha(join(dir, f))]));
const hearsay = (cwd, ...args) => spawnSync(TSX, [join(REPO, 'packages/cli/src/index.ts'), ...args], { cwd, encoding: 'utf8' });

function workspace(server, arm, W, port) {
  const S = SERVERS[server];
  rmSync(W, { recursive: true, force: true });
  mkdirSync(join(W, 'src'), { recursive: true });
  mkdirSync(join(W, 'suites'));
  const files = V2 ? { ...Object.fromEntries(Object.entries(S.files).filter(([from]) => from !== 'flawed.ts')), [S.v2.file]: 'server.ts' } : S.files;
  const rename = V2 ? S.v2.rename : S.rename;
  for (const [from, to] of Object.entries(files)) writeFileSync(join(W, 'src', to), sanitise(readFileSync(join(REPO, 'servers', server, 'src', from), 'utf8'), to === 'server.ts' ? rename : undefined));
  writeFileSync(join(W, 'src/index.ts'), S.index);
  let start;
  if (V2) {
    // Self-contained: its own tsx and dependencies from the npm cache, so no path in the workspace points into the repo.
    mkdirSync(join(W, 'vendor'));
    cpSync(KIT, join(W, 'vendor/hearsayhq-kit-0.1.0.tgz'));
    writeFileSync(join(W, 'package.json'), JSON.stringify({ name: `${server}-addon`, private: true, type: 'module', dependencies: { '@hearsayhq/kit': 'file:vendor/hearsayhq-kit-0.1.0.tgz', '@modelcontextprotocol/sdk': '1.31.0', zod: '4.6.5', tsx: '4.23.15' } }, null, 2));
    execFileSync('npm', ['install', '--prefer-offline', '--no-audit', '--no-fund', '--silent'], { cwd: W, stdio: 'ignore' });
    start = `cd ${W} && PORT=${port} node_modules/.bin/tsx src/index.ts`;
  } else {
    mkdirSync(join(W, 'node_modules/@hearsayhq/kit'), { recursive: true });
    writeFileSync(join(W, 'package.json'), JSON.stringify({ name: `${server}-addon`, private: true, type: 'module' }, null, 2));
    execFileSync('tar', ['-xzf', KIT, '-C', join(W, 'node_modules/@hearsayhq/kit'), '--strip-components', '1']);
    for (const dep of ['@modelcontextprotocol', 'zod']) symlinkSync(join(REPO, 'node_modules', dep), join(W, 'node_modules', dep));
    start = `cd ${W} && PORT=${port} ${TSX} src/index.ts`;
  }
  const suite = readFileSync(join(REPO, 'suites', `${server}.yaml`), 'utf8')
    .replace(/url: http:\/\/localhost:\d+\/mcp/, `url: http://localhost:${port}/mcp`)
    .replace(/start: .*/, `start: ${start}`);
  writeFileSync(join(W, 'suites', `${server}.yaml`), suite);
  hearsay(W, 'lock', `suites/${server}.yaml`);
  if (arm === 'A') {
    mkdirSync(join(W, '.claude/skills'), { recursive: true });
    cpSync(join(REPO, 'skills/fix-hearsay-findings'), join(W, '.claude/skills/fix-hearsay-findings'), { recursive: true });
    const mcp = V2 ? { command: join(HARNESS, 'node_modules/.bin/hearsay-mcp'), args: ['--cwd', W] } : { command: TSX, args: [join(REPO, 'packages/mcp/src/index.ts'), '--cwd', W] };
    writeFileSync(join(W, 'mcp.json'), JSON.stringify({ mcpServers: { hearsay: mcp } }));
  }
  writeFileSync(join(W, '.gitignore'), 'node_modules\nreports\nmcp.json\npackage-lock.json\n');
  execFileSync('git', ['init', '-q'], { cwd: W });
  execFileSync('git', ['add', '-A'], { cwd: W });
  execFileSync('git', ['-c', 'user.name=hearsay', '-c', 'user.email=hearsay@localhost', 'commit', '-qm', 'add-on'], { cwd: W });
  const suites = join(W, '..', 'suites-original');
  cpSync(join(W, 'suites'), suites, { recursive: true });
  return { suites, before: hashes(join(W, 'suites')) };
}

function agent(server, arm, W) {
  const args = ['-p', PROMPT[arm](server), '--model', opt.model, '--setting-sources', 'project', '--allowedTools', ...TOOLS[arm], ...(arm === 'Bs' ? [] : ['--disallowedTools', 'Bash']), '--permission-mode', 'acceptEdits', '--max-budget-usd', '5', '--output-format', 'stream-json', '--verbose'];
  if (arm === 'A') args.push('--mcp-config', join(W, 'mcp.json'), '--strict-mcp-config');
  else args.push('--strict-mcp-config');
  const r = spawnSync('claude', args, { cwd: W, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  writeFileSync(join(W, '..', 'agent-run.jsonl'), r.stdout ?? '');
  const audit = outside(W, r.stdout ?? '');
  const events = (r.stdout ?? '').split('\n').flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
  const uses = events.filter((e) => e.type === 'assistant').flatMap((e) => (e.message.content ?? []).filter((b) => b.type === 'tool_use'));
  const result = events.find((e) => e.type === 'result') ?? {};
  const init = events.find((e) => e.type === 'system' && e.subtype === 'init') ?? {};
  const shell = uses.filter((u) => u.name === 'Bash').length;
  return { ...audit, shell, keySource: init.apiKeySource ?? null, agentOk: result.subtype === 'success' && !result.is_error, agentStatus: result.subtype ?? `exit ${r.status}`, durationMs: result.duration_ms ?? null, costUsd: result.total_cost_usd ?? null, turns: result.num_turns ?? null, runs: uses.filter((u) => u.name === 'mcp__hearsay__hearsay_run').length, edits: uses.filter((u) => ['Edit', 'Write'].includes(u.name) && !String(u.input.file_path).includes('/suites/')).length, suiteEdits: uses.filter((u) => ['Edit', 'Write'].includes(u.name) && String(u.input.file_path).includes('/suites/')).length };
}

/** Every file the agent touched outside its workspace, from its own transcript: what it asked for and what came back. */
function outside(W, transcript) {
  const FORBIDDEN = /<repo>\/(servers|suites|docs|skills|holdouts)\/|holdout|\/build\/experiment\/|<out>\/(?!\.harness)/;
  const OUTDIR = resolve(W, '../..');
  const scrub = (t) => t.replaceAll(W, '<workspace>').replaceAll(OUTDIR, '<out>').replaceAll(REPO, '<repo>');
  const events = transcript.split('\n').flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
  const hits = new Map();
  const shell = new Map();
  for (const e of events.filter((x) => x.type === 'assistant')) {
    for (const b of e.message.content ?? []) {
      if (b.type !== 'tool_use') continue;
      // A shell command can reach anywhere; its text and its output are both read below.
      if (b.name === 'Bash') shell.set(b.id, `Bash ${scrub(String(b.input?.command ?? '')).slice(0, 200)}`);
      for (const key of ['file_path', 'path', 'notebook_path']) {
        const p = b.input?.[key];
        if (typeof p !== 'string') continue;
        const abs = isAbsolute(p) ? resolve(p) : resolve(W, p);
        if (abs !== W && !abs.startsWith(W + '/')) hits.set(b.id, `${b.name} ${abs.replace(REPO, '<repo>')} ${[b.input.pattern, b.input.glob].filter(Boolean).join(' ')}`.trim());
      }
    }
  }
  const forbidden = [...hits.values(), ...shell.values()].filter((h) => FORBIDDEN.test(h));
  const reached = [...shell.values()].filter((c) => /<repo>|<out>|(^|\s)\.\.(\/|\s|$)/.test(c)).length;
  for (const e of events.filter((x) => x.type === 'user' && Array.isArray(x.message?.content))) {
    for (const b of e.message.content) {
      if (b.type !== 'tool_result' || !(hits.has(b.tool_use_id) || shell.has(b.tool_use_id))) continue;
      const text = scrub(typeof b.content === 'string' ? b.content : (b.content ?? []).map((c) => c.text ?? '').join('\n'));
      // Another run's packed copy of the kit is the same package this run has; its sources are not.
      for (const line of text.split('\n')) if (FORBIDDEN.test(line) && !/node_modules\/@hearsayhq\/(kit|mandate)\//.test(line)) forbidden.push(`${hits.get(b.tool_use_id) ?? shell.get(b.tool_use_id)} returned ${line.trim().slice(0, 160)}`);
    }
  }
  return { outsideAccess: hits.size + reached, forbiddenAccess: forbidden };
}

function judge(server, W, ws) {
  const manipulated = JSON.stringify(hashes(join(W, 'suites'))) !== JSON.stringify(ws.before);
  rmSync(join(W, 'suites'), { recursive: true, force: true });
  cpSync(ws.suites, join(W, 'suites'), { recursive: true });
  const holdout = V2 ? join(REPO, 'holdouts/v2', `${server}.holdout.yaml`) : join(REPO, 'suites', `${server}.holdout.yaml`);
  if (!existsSync(holdout)) throw new Error(`missing ${holdout} (local only, never committed)`);
  cpSync(holdout, join(W, 'suites', `${server}.holdout.yaml`));
  // Only the judge's own report counts, never one the agent's runs left behind.
  rmSync(join(W, 'reports'), { recursive: true, force: true });
  const run = hearsay(W, 'run', `suites/${server}.yaml`, '--holdout');
  const reports = existsSync(join(W, 'reports')) ? readdirSync(join(W, 'reports')).filter((f) => f.startsWith(server)).sort() : [];
  if (!reports.length) {
    // The server no longer starts or answers: nothing passes.
    const cases = (readFileSync(holdout, 'utf8').match(/^\s*- id:/gm) ?? []).length;
    return { manipulated, startFailed: true, visibleErrors: null, visibleFailed: null, holdoutPassed: 0, holdoutCases: cases, holdoutErrors: null, judgeOutput: (run.stderr || run.stdout).slice(-500) };
  }
  const r = JSON.parse(readFileSync(join(W, 'reports', reports.at(-1)), 'utf8'));
  // Holdouts are counted in runs (case × variant): a case with a misheard variant counts twice.
  return { manipulated, visibleErrors: r.summary.errors, visibleFailed: `${r.summary.failedRuns}/${r.summary.runs}`, holdoutPassed: r.holdout.runs - r.holdout.failedRuns, holdoutCases: r.holdout.runs, holdoutCaseIds: r.holdout.cases, holdoutErrors: r.holdout.errors };
}

if (opt.audit) {
  // Re-read the transcripts of a finished experiment; no agent runs, no judging.
  for (const dir of readdirSync(OUT).filter((d) => existsSync(join(OUT, d, 'agent-run.jsonl'))).sort()) {
    const a = outside(join(OUT, dir, 'addon'), readFileSync(join(OUT, dir, 'agent-run.jsonl'), 'utf8'));
    console.log(`${dir}: ${a.outsideAccess} accesses outside the workspace, ${a.forbiddenAccess.length} to servers, suites, docs, skills, holdouts or other runs${a.forbiddenAccess.length ? `\n  ${a.forbiddenAccess.join('\n  ')}` : ''}`);
  }
  process.exit(0);
}
if (!DRY && process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is set: the runs would be billed to the API. Unset it to run on the subscription.');
// v2 packs afresh, so the kit and the Hearsay MCP server the agents get match the engine that judges them.
if (V2 || !existsSync(KIT)) execFileSync('node', [join(REPO, 'scripts/pack.mjs')], { stdio: 'ignore' });
mkdirSync(OUT, { recursive: true });
if (V2 && !DRY && ARMS.includes('A') && !existsSync(join(HARNESS, 'node_modules/.bin/hearsay-mcp'))) {
  mkdirSync(HARNESS, { recursive: true });
  writeFileSync(join(HARNESS, 'package.json'), JSON.stringify({ name: 'harness', private: true }));
  execFileSync('npm', ['install', MCP, '--prefer-offline', '--no-audit', '--no-fund', '--silent'], { cwd: HARNESS, stdio: 'ignore' });
}
const RESULTS = join(OUT, 'results.jsonl');
const done = existsSync(RESULTS) ? readFileSync(RESULTS, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
const rows = [];
let port = Number(opt.port);
const first = Number(opt.first);
const limit = opt.limit ? Number(opt.limit) : Infinity;
let fresh = 0;
grid: for (let i = first; i < first + (DRY ? 1 : Number(opt.runs)); i++) {
  for (const server of opt.servers.split(',')) {
    for (const arm of DRY ? ['-'] : ARMS) {
      const armName = DRY ? 'baseline' : arm;
      const prior = done.find((r) => r.server === server && r.arm === armName && r.run === i && r.agentOk !== false);
      if (prior) {
        rows.push(prior);
        continue;
      }
      if (fresh >= limit) break grid;
      fresh++;
      const W = join(OUT, `${server}-${arm}-${i}`, 'addon');
      const ws = workspace(server, arm === '-' ? 'B' : arm, W, port++);
      const a = DRY ? {} : agent(server, arm, W);
      const row = { server, arm: armName, run: i, model: DRY ? null : opt.model, ...a, ...judge(server, W, ws) };
      rows.push(row);
      appendFileSync(RESULTS, JSON.stringify(row) + '\n');
      console.error(`${server} ${LABEL[row.arm] ?? row.arm} #${i}: holdout ${row.holdoutPassed}/${row.holdoutCases}, visible errors ${row.startFailed ? 'server did not start' : row.visibleErrors}${row.manipulated ? ', SUITES CHANGED' : ''}${a.agentOk === false ? `, AGENT ${a.agentStatus} (not counted)` : ''}${a.costUsd != null ? `, API-equivalent $${a.costUsd.toFixed(2)}` : ''}`);
      if (a.forbiddenAccess?.length) console.error(`  the agent read outside its workspace: ${a.forbiddenAccess.join('; ')}`);
      if (a.keySource && a.keySource !== 'none') throw new Error(`the run used key source "${a.keySource}", not the subscription: stopped`);
    }
  }
}
console.log('| Server | Arm | Run | Holdout passed | Visible errors | Suite changed | hearsay_run calls | Edits | Turns | Agent | API-equivalent cost¹ |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|');
for (const r of rows) console.log(`| ${r.server} | ${LABEL[r.arm] ?? r.arm} | ${r.run} | ${r.holdoutPassed}/${r.holdoutCases} | ${r.startFailed ? 'did not start' : r.visibleErrors} | ${r.manipulated ? 'yes' : 'no'} | ${r.runs ?? '–'} | ${r.edits ?? '–'} | ${r.turns ?? '–'} | ${r.agentOk === false ? `failed: ${r.agentStatus}` : r.agentStatus ? 'ok' : '–'} | ${r.costUsd != null ? `$${r.costUsd.toFixed(2)}` : '–'} |`);
if (!DRY) {
  console.log('');
  for (const arm of ARMS) {
    const rs = rows.filter((r) => r.arm === arm && r.agentOk !== false);
    const sum = (f) => rs.reduce((n, r) => n + (f(r) ?? 0), 0);
    console.log(`Arm ${LABEL[arm] ?? arm}: ${rs.length} runs, holdout ${sum((r) => r.holdoutPassed)}/${sum((r) => r.holdoutCases)}, visible errors left in ${rs.filter((r) => r.startFailed || r.visibleErrors > 0).length} runs, suites changed in ${rs.filter((r) => r.manipulated).length}, API-equivalent $${sum((r) => r.costUsd).toFixed(2)}`);
  }
  console.log('\n¹ `total_cost_usd` from Claude Code. On a subscription it is what the tokens would cost at API prices, not a bill.');
}
console.error(`results: ${OUT}/results.jsonl`);
