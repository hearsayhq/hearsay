/**
 * The runner (FR-004, FR-020, FR-024): every case × variant in a fresh session as a
 * fresh principal, `after` chains replayed as setup turns, checks applied, report
 * built. Verdicts come only from here; CLI and console display them.
 */
import { randomUUID } from 'node:crypto';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { CHECKS } from './catalog';
import { IMPLEMENTED, SERVER_CHECKS, TURN_CHECKS } from './checks/index';
import type { Cassette, ModelProvider, Orchestrator, OrchestratorMode } from './orchestrator';
import { llmOrchestrator } from './orchestrators/llm';
import { scriptedCall, scriptedOrchestrator } from './orchestrators/scripted';
import { CLEAN, variantsFor, type Variant } from './perturb/index';
import { loadRecorded } from './perturb/recorded';
import type { CaseResult, Finding, Report } from './report';
import { McpSession } from './session';
import { loadHoldout, serverChecksFor, turnChecksFor, type Suite, type SuiteCase } from './suite';
import type { Span, ToolResult, Trace, Turn } from './trace';

export interface RunOptions {
  /** Only run these case ids (their `after` chains still run as setup). */
  only?: string[];
  /** Override the suite's orchestrator. */
  orchestrator?: OrchestratorMode;
  /** Override the suite's server URL (tests, ephemeral ports). */
  url?: string;
  /** The file the suite came from; enables suite.integrity and recorded variants. */
  suitePath?: string;
  /** PRNG seed for perturbations (default 1); recorded in the report. */
  seed?: number;
  /** Also run `<suite>.holdout.yaml` (FR-018). CLI only; the MCP server never sets it. */
  holdout?: boolean;
  /** The model for llm and replay mode (a ReplayProvider in replay mode). */
  provider?: ModelProvider;
  onResult?: (r: CaseResult) => void;
}

export const newPrincipal = () => `hs-test-${randomUUID()}`;

/** The `after` chain of a case, depth first, each case once, in order. */
export function setupChain(suite: Suite, c: SuiteCase, seen = new Set<string>()): SuiteCase[] {
  const out: SuiteCase[] = [];
  for (const id of c.after ?? []) {
    if (seen.has(id)) continue;
    const dep = suite.cases.find((x) => x.id === id);
    if (!dep) continue;
    out.push(...setupChain(suite, dep, seen));
    if (!seen.has(id)) {
      seen.add(id);
      out.push(dep);
    }
  }
  return out;
}

function orchestratorFor(mode: OrchestratorMode, c: SuiteCase, variant: Variant, provider?: ModelProvider): Orchestrator {
  if (mode === 'scripted') return scriptedOrchestrator(c, variant.edits);
  if (!provider) throw new Error(`${mode} mode needs a model provider (llm) or a cassette (replay)`);
  return { ...llmOrchestrator(provider), mode };
}

async function playCase(session: McpSession, suite: Suite, c: SuiteCase, mode: OrchestratorMode, history: Turn[], variant: Variant, provider: ModelProvider | undefined, setupOf?: string): Promise<Turn[]> {
  const said = Array.isArray(c.say) ? c.say : [c.say];
  // A variant rewrites what was heard in the case's last utterance.
  const heardAll = said.map((u, i) => (i === said.length - 1 ? variant.heard : u));
  session.human = { answer: c.human.answer, ...(c.human.content ? { content: c.human.content } : {}) };
  const orchestrator = orchestratorFor(mode, c, variant, provider);
  const { asrMs, speakTtfbMs } = suite.latencyModel;
  const turns: Turn[] = [];

  for (const [i, utterance] of said.entries()) {
    const heard = heardAll[i]!;
    if (session.revision !== (history.at(-1)?.toolListRevision ?? 0)) await session.refreshTools();
    const spans: Span[] = [{ kind: 'asr', name: 'asr', startMs: 0, endMs: asrMs, modeled: true }];
    // scripted: no planning, a zero-length span (docs/03); llm/replay: one span per model call.
    if (mode === 'scripted') spans.push({ kind: 'plan', name: 'scripted', startMs: asrMs, endMs: asrMs, modeled: true });
    let clock = asrMs;
    const turn: Turn = {
      id: `${c.id}#${i + 1}`,
      utterance,
      heard,
      spans,
      toolCalls: [],
      elicitations: [],
      spoken: '',
      toolListRevision: session.revision,
      ...(setupOf ? { setupOf } : {}),
    };
    const callTool = async (name: string, args: Record<string, unknown>): Promise<ToolResult> => {
      const call = await session.callTool(name, args);
      spans.push({ kind: 'tool', name, startMs: clock, endMs: clock + call.latencyMs });
      for (const e of call.elicitations) {
        spans.push({ kind: 'elicitation', name: 'elicitation', startMs: clock + e.startMs, endMs: clock + e.endMs });
        const { startMs: _s, endMs: _e, ...record } = e;
        turn.elicitations.push(record);
      }
      clock += call.latencyMs;
      turn.toolCalls.push({ tool: name, args, result: call.result, latencyMs: call.latencyMs });
      return call.result;
    };
    const recordPlan = (ms: number, name = mode) => {
      spans.push({ kind: 'plan', name, startMs: clock, endMs: clock + ms, ...(mode === 'replay' ? { attrs: { recorded: true } } : {}) });
      clock += ms;
    };
    const { spoken } = await orchestrator.respond({ heard, tools: session.tools, history: [...history, ...turns], callTool, recordPlan });
    turn.spoken = spoken;
    spans.push({ kind: 'speak', name: 'speak', startMs: clock, endMs: clock + speakTtfbMs, modeled: true });
    turns.push(turn);
  }
  return turns;
}

const sortFindings = (f: Finding[]) => [...f].sort((a, b) => a.checkId.localeCompare(b.checkId) || (a.turnId ?? '').localeCompare(b.turnId ?? ''));

export async function runSuite(suiteIn: Suite, opts: RunOptions = {}): Promise<Report> {
  let suite = suiteIn;
  const url = opts.url ?? suite.server.url;
  const mode = opts.orchestrator ?? suite.orchestrator;
  const startedAt = new Date().toISOString();
  const holdoutCases = opts.holdout && opts.suitePath ? await loadHoldout(opts.suitePath, suite) : [];
  const holdoutIds = new Set(holdoutCases.map((c) => c.id));
  if (holdoutCases.length) suite = { ...suite, cases: [...suite.cases, ...holdoutCases] };
  const selected = suite.cases.filter((c) => holdoutIds.has(c.id) || !opts.only?.length || opts.only.includes(c.id));
  const cases: CaseResult[] = [];
  let tools: Tool[] | undefined;
  let firstServer: Trace['server'] | undefined;

  const seed = opts.seed ?? 1;
  const recorded = opts.suitePath ? await loadRecorded(opts.suitePath, suite.suite) : {};

  for (const c of selected) {
    const said = Array.isArray(c.say) ? c.say : [c.say];
    const last = said.at(-1)!;
    const call = scriptedCall(c);
    const variants = variantsFor(c.id, last, c.fuzz, { seed, mode, ...(call ? { args: call.args } : {}), ...(recorded[c.id] ? { recorded: recorded[c.id] } : {}) });
    let clean: Trace | undefined;
    for (const variant of variants) {
      const principal = newPrincipal();
      const session = await McpSession.open({ url, principal, elicitation: c.client.elicitation });
      try {
        tools ??= session.tools;
        firstServer ??= session.serverInfo();
        const trace: Trace = {
          suite: suite.suite,
          caseId: c.id,
          variant: variant.id,
          ...(variant.edits.length ? { edits: variant.edits } : {}),
          orchestrator: mode,
          principal,
          client: { elicitation: c.client.elicitation },
          server: session.serverInfo(),
          turns: [],
          startedAt: new Date().toISOString(),
        };
        for (const dep of setupChain(suite, c)) {
          const depSaid = Array.isArray(dep.say) ? dep.say : [dep.say];
          trace.turns.push(...(await playCase(session, suite, dep, mode, trace.turns, CLEAN(depSaid.at(-1)!), opts.provider, dep.id)));
        }
        const own = await playCase(session, suite, c, mode, trace.turns, variant, opts.provider);
        trace.turns.push(...own);
        if (variant.id === 'clean') clean = trace;

        const findings = turnChecksFor(suite, c)
          .flatMap((id) => TURN_CHECKS.get(id)?.run({ suite, case: c, trace, turns: own, tools: session.tools, ...(clean && variant.id !== 'clean' ? { clean } : {}) }) ?? []);
        const result: CaseResult = {
          caseId: c.id,
          variant: variant.id,
          trace,
          findings: sortFindings(findings),
          verdict: findings.some((f) => f.severity === 'error') ? 'fail' : 'pass',
          ...(holdoutIds.has(c.id) ? { holdout: true as const } : {}),
        };
        cases.push(result);
        opts.onResult?.(result);
      } finally {
        await session.close();
      }
    }
  }

  const serverFindings: Finding[] = [];
  if (firstServer && tools)
    for (const id of serverChecksFor(suite)) {
      const check = SERVER_CHECKS.get(id);
      if (check) serverFindings.push(...(await check.run({ suite, url, tools, server: firstServer, newPrincipal, ...(opts.suitePath ? { suitePath: opts.suitePath } : {}) })));
    }

  const asked = new Set([...suite.checks, ...selected.flatMap((c) => c.checks ?? []), ...CHECKS.filter((x) => x.alwaysOn).map((x) => x.id)]);
  const skippedChecks = [...asked].filter((id) => !IMPLEMENTED.has(id)).sort();
  const visible = cases.filter((r) => !r.holdout);
  const hidden = cases.filter((r) => r.holdout);
  const tally = (fs: Finding[], s: Finding['severity']) => fs.filter((f) => f.severity === s).length;
  const visibleFindings = [...serverFindings, ...visible.flatMap((r) => r.findings)];
  const hiddenFindings = hidden.flatMap((r) => r.findings);

  return {
    suite: suite.suite,
    startedAt,
    orchestrator: mode,
    seed,
    tools: tools ?? [],
    serverFindings: sortFindings(serverFindings),
    cases,
    skippedChecks,
    summary: {
      cases: visible.length,
      failed: visible.filter((r) => r.verdict === 'fail').length,
      errors: tally(visibleFindings, 'error'),
      warnings: tally(visibleFindings, 'warn'),
      infos: tally(visibleFindings, 'info'),
      skipped: skippedChecks.length,
    },
    ...(opts.holdout
      ? { holdout: { cases: hidden.length, failed: hidden.filter((r) => r.verdict === 'fail').length, errors: tally(hiddenFindings, 'error'), warnings: tally(hiddenFindings, 'warn'), infos: tally(hiddenFindings, 'info') } }
      : {}),
  };
}
