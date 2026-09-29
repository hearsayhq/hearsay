/**
 * The runner (FR-004, FR-020, FR-024): every case × variant in a fresh session as a
 * fresh principal, `after` chains replayed as setup turns, checks applied, report
 * built. Verdicts come only from here; CLI and console display them.
 */
import { randomUUID } from 'node:crypto';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { CHECKS } from './catalog';
import { IMPLEMENTED, SERVER_CHECKS, TURN_CHECKS } from './checks/index';
import type { Orchestrator, OrchestratorMode } from './orchestrator';
import { scriptedOrchestrator } from './orchestrators/scripted';
import type { CaseResult, Finding, Report } from './report';
import { McpSession } from './session';
import { serverChecksFor, turnChecksFor, type Suite, type SuiteCase } from './suite';
import type { Span, ToolResult, Trace, Turn } from './trace';

export interface RunOptions {
  /** Only run these case ids (their `after` chains still run as setup). */
  only?: string[];
  /** Override the suite's orchestrator. */
  orchestrator?: OrchestratorMode;
  /** Override the suite's server URL (tests, ephemeral ports). */
  url?: string;
  /** The file the suite came from; enables suite.integrity. */
  suitePath?: string;
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

function orchestratorFor(mode: OrchestratorMode, c: SuiteCase): Orchestrator {
  if (mode === 'scripted') return scriptedOrchestrator(c);
  throw new Error(`orchestrator "${mode}" is milestone M3 (docs/07)`);
}

async function playCase(session: McpSession, suite: Suite, c: SuiteCase, mode: OrchestratorMode, history: Turn[], setupOf?: string): Promise<Turn[]> {
  const utterances = Array.isArray(c.say) ? c.say : [c.say];
  session.human = { answer: c.human.answer, ...(c.human.content ? { content: c.human.content } : {}) };
  const orchestrator = orchestratorFor(mode, c);
  const { asrMs, speakTtfbMs } = suite.latencyModel;
  const turns: Turn[] = [];

  for (const [i, utterance] of utterances.entries()) {
    if (session.revision !== (history.at(-1)?.toolListRevision ?? 0)) await session.refreshTools();
    const spans: Span[] = [{ kind: 'asr', name: 'asr', startMs: 0, endMs: asrMs, modeled: true }];
    const planMs = 0; // scripted: no planning (docs/03)
    spans.push({ kind: 'plan', name: mode, startMs: asrMs, endMs: asrMs + planMs, modeled: mode !== 'llm' });
    let clock = asrMs + planMs;
    const turn: Turn = {
      id: `${c.id}#${i + 1}`,
      utterance,
      heard: utterance,
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
    const { spoken } = await orchestrator.respond({ heard: utterance, tools: session.tools, history: [...history, ...turns], callTool });
    turn.spoken = spoken;
    spans.push({ kind: 'speak', name: 'speak', startMs: clock, endMs: clock + speakTtfbMs, modeled: true });
    turns.push(turn);
  }
  return turns;
}

const sortFindings = (f: Finding[]) => [...f].sort((a, b) => a.checkId.localeCompare(b.checkId) || (a.turnId ?? '').localeCompare(b.turnId ?? ''));

export async function runSuite(suite: Suite, opts: RunOptions = {}): Promise<Report> {
  const url = opts.url ?? suite.server.url;
  const mode = opts.orchestrator ?? suite.orchestrator;
  const startedAt = new Date().toISOString();
  const selected = suite.cases.filter((c) => !opts.only?.length || opts.only.includes(c.id));
  const cases: CaseResult[] = [];
  let tools: Tool[] | undefined;
  let firstServer: Trace['server'] | undefined;

  for (const c of selected) {
    for (const variant of ['clean']) {
      const principal = newPrincipal();
      const session = await McpSession.open({ url, principal, elicitation: c.client.elicitation });
      try {
        tools ??= session.tools;
        firstServer ??= session.serverInfo();
        const trace: Trace = {
          suite: suite.suite,
          caseId: c.id,
          variant,
          orchestrator: mode,
          principal,
          client: { elicitation: c.client.elicitation },
          server: session.serverInfo(),
          turns: [],
          startedAt: new Date().toISOString(),
        };
        for (const dep of setupChain(suite, c)) trace.turns.push(...(await playCase(session, suite, dep, mode, trace.turns, dep.id)));
        const own = await playCase(session, suite, c, mode, trace.turns);
        trace.turns.push(...own);

        const findings = turnChecksFor(suite, c)
          .flatMap((id) => TURN_CHECKS.get(id)?.run({ suite, case: c, trace, turns: own, tools: session.tools }) ?? []);
        const result: CaseResult = { caseId: c.id, variant, trace, findings: sortFindings(findings), verdict: findings.some((f) => f.severity === 'error') ? 'fail' : 'pass' };
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
  const all = [...serverFindings, ...cases.flatMap((r) => r.findings)];
  const count = (s: Finding['severity']) => all.filter((f) => f.severity === s).length;

  return {
    suite: suite.suite,
    startedAt,
    orchestrator: mode,
    seed: 1,
    tools: tools ?? [],
    serverFindings: sortFindings(serverFindings),
    cases,
    skippedChecks,
    summary: {
      cases: cases.length,
      failed: cases.filter((r) => r.verdict === 'fail').length,
      errors: count('error'),
      warnings: count('warn'),
      infos: count('info'),
      skipped: skippedChecks.length,
    },
  };
}
