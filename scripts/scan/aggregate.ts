/**
 * docs/16 from a scan's results (FR-062): aggregates only, no repo or team names. Alexa+ add-on
 * servers (groups A–C) and general MCP servers not built for voice (group E) are reported apart
 * and never added together.
 *
 *   npx tsx scripts/scan/aggregate.ts --out <dir with scan results>
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { CHECKS, QUESTIONS, QUESTION_ORDER, type Question } from '../../packages/engine/src/catalog';

interface F { checkId: string; severity: 'error' | 'warn' | 'info'; question: Question }
interface Row { group: string; mode: string; stage: string; started?: boolean; tools?: number; annotated?: number; readOnly?: number; findings?: F[]; calls?: Array<{ ms?: number; timeout?: boolean; isError?: boolean; findings?: F[] }>; outbound?: boolean }

const { values: opt } = parseArgs({ options: { out: { type: 'string' } } });
if (!opt.out) throw new Error('--out <dir> is required');
const rows: Row[] = readdirSync(opt.out).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(join(opt.out!, f), 'utf8')));
const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)} %` : '–');
const STOPPED: Record<string, string> = {
  clone: 'could not be cloned',
  build: 'did not build',
  start: 'did not answer within 120 s',
  lint: 'answered but refused an MCP client without credentials or a browser session',
  calls: 'failed while being called',
};
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2) : 0; };

function section(title: string, rs: Row[]): string[] {
  const ok = rs.filter((r) => r.started);
  const out = [`## ${title}`, '', `${rs.length} servers; ${ok.length} started as their README says and answered MCP (${pct(ok.length, rs.length)}).`, ''];
  const stops: Record<string, number> = {};
  for (const r of rs.filter((x) => !x.started)) stops[r.stage] = (stops[r.stage] ?? 0) + 1;
  if (Object.keys(stops).length) out.push(`Did not get through: ${Object.entries(stops).map(([s, n]) => `${n} ${STOPPED[s] ?? `stopped at ${s}`}`).join('; ')}.`, '');
  const tools = ok.map((r) => r.tools ?? 0);
  const allTools = tools.reduce((a, b) => a + b, 0);
  // The headline numbers (film, Devpost): servers with something to fix, and with an error a run fails on.
  const all = (r: Row) => [...(r.findings ?? []), ...(r.calls ?? []).flatMap((c) => c.findings ?? [])];
  const withError = ok.filter((r) => all(r).some((f) => f.severity === 'error')).length;
  const toFix = ok.filter((r) => all(r).some((f) => f.severity !== 'info')).length;
  out.push(`Servers with something to fix (an error or a warning): ${toFix} of ${ok.length}; with an error, which fails a run: ${withError} of ${ok.length}.`, '');
  out.push(`Tools per server: median ${median(tools)}. Tools with side-effect annotations: ${pct(ok.reduce((a, r) => a + (r.annotated ?? 0), 0), allTools)}; marked read-only: ${pct(ok.reduce((a, r) => a + (r.readOnly ?? 0), 0), allTools)}.`, '');
  out.push('| Question | Servers with an error | Servers with a warning |', '|---|---|---|');
  for (const q of QUESTION_ORDER) {
    const has = (s: string) => ok.filter((r) => [...(r.findings ?? []), ...(r.calls ?? []).flatMap((c) => c.findings ?? [])].some((f) => f.question === q && f.severity === s)).length;
    out.push(`| ${QUESTIONS[q]} | ${has('error')} of ${ok.length} | ${has('warn')} of ${ok.length} |`);
  }
  out.push('', '| Check | Servers | Severity |', '|---|---|---|');
  const counts = new Map<string, { n: number; sev: Set<string> }>();
  for (const r of ok) {
    const seen = new Map<string, Set<string>>();
    for (const f of [...(r.findings ?? []), ...(r.calls ?? []).flatMap((c) => c.findings ?? [])]) (seen.get(f.checkId) ?? seen.set(f.checkId, new Set()).get(f.checkId)!).add(f.severity);
    for (const [id, sev] of seen) { const c = counts.get(id) ?? { n: 0, sev: new Set<string>() }; c.n++; sev.forEach((s) => c.sev.add(s)); counts.set(id, c); }
  }
  for (const [id, c] of [...counts].sort((a, b) => b[1].n - a[1].n)) out.push(`| \`${id}\` (${CHECKS.find((x) => x.id === id)?.summary ?? ''}) | ${c.n} of ${ok.length} | ${[...c.sev].join(', ')} |`);
  const calls = ok.flatMap((r) => r.calls ?? []);
  if (calls.length) {
    const timed = calls.filter((c) => typeof c.ms === 'number').map((c) => c.ms!);
    const called = ok.filter((r) => r.calls?.length);
    const failing = called.filter((r) => r.calls!.some((c) => c.findings?.some((f) => f.severity === 'error'))).length;
    out.push('', `Read-only tools without arguments, judged as replies: ${calls.length} on ${called.length} servers; ${failing} of these ${called.length} servers returned at least one reply with an error. Median ${Math.round(median(timed))} ms; over 500 ms: ${pct(timed.filter((m) => m > 500).length, timed.length)}; timed out after 10 s: ${calls.filter((c) => c.timeout).length}. Measured locally, so the times say nothing about a hosted server.`);
  }
  const listOnly = rs.filter((r) => r.mode === 'list');
  if (listOnly.some((r) => r.outbound !== undefined)) out.push('', `Listed only (no calls): ${listOnly.length}; of these, ${listOnly.filter((r) => r.outbound).length} tried to reach the network at start (blocked).`);
  return [...out, ''];
}

const alexa = rows.filter((r) => r.group !== 'E');
const general = rows.filter((r) => r.group === 'E');
console.log([
  '# Scan of public MCP servers',
  '',
  'Aggregates only (FR-062, D-024): no repository or team names, no issues or pull requests to anyone. Servers were pinned to a commit, built and run locally in containers with no network beyond Hearsay and no credentials. Servers listed only were read (handshake and `tools/list`) and never called. In calls mode, each tool the server marks read-only that needs no arguments was called three times: twice to see that it reads the same, once to judge the reply as spoken. The two groups below are never added together.',
  '',
  'What this covers: the declared surface (`hearsay lint`) and replies of read-only tools. Checks that need a suite (misheard values, consent, mandates, latency of real calls) did not run, so a server without findings here is not shown to be voice-ready.',
  '',
  ...section('Alexa+ add-on servers (hackathon entries)', alexa),
  ...section('General MCP servers, not built for voice', general),
].join('\n'));
