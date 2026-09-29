/**
 * Console sessions (FR-040/041): one MCP session per browser tab, a real person answering
 * elicitations in the browser, and every turn judged by the engine as it happens.
 */
import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { CHECKS } from '../catalog';
import { firstAudio } from '../latency';
import { TURN_CHECKS } from '../checks/index';
import { llmOrchestrator } from '../orchestrators/llm';
import type { ModelProvider } from '../orchestrator';
import type { Finding } from '../report';
import { newPrincipal, playTurn } from '../runner';
import { McpSession } from '../session';
import { SuiteSchema, turnChecksFor, type Suite } from '../suite';
import type { Trace, Turn } from '../trace';
import { nearestCasePlanner, type Match } from './planner';

export interface ConsoleEvent {
  type: 'turn' | 'elicitation' | 'elicitation-answered' | 'tools';
  data: unknown;
}

interface Pending {
  resolve: (a: { action: 'accept' | 'decline' | 'cancel' }) => void;
}

/**
 * Turn checks the console can run live: those that judge a single clean turn. Of these it runs
 * the ones the suite selects, as CI would (the matched case's own checks included). The consent
 * pair uses the matched case's `confirm` expectation. Checks that need variants, state
 * snapshots or exact arguments stay in `hearsay run`.
 */
const LIVE = ['latency.tool', 'latency.first_audio', 'speak.length', 'speak.no_structured_dump', 'speak.lists', 'lint.error_actionable', 'protocol.refusal_as_result', 'consent.path', 'consent.states_details'];

export class ConsoleSession extends EventEmitter {
  readonly id = randomUUID();
  readonly turns: Turn[] = [];
  private pending = new Map<string, Pending>();

  private constructor(
    readonly session: McpSession,
    readonly suite: Suite,
    private provider?: ModelProvider,
  ) {
    super();
  }

  static async open(url: string, suite?: Suite, provider?: ModelProvider): Promise<ConsoleSession> {
    const session = await McpSession.open({ url, principal: newPrincipal(), elicitation: true });
    const s = suite ?? SuiteSchema.parse({ suite: 'console', server: { url }, checks: LIVE, cases: [{ id: 'none', say: '-', expect: { noTool: true } }] });
    const cs = new ConsoleSession(session, s, provider);
    session.human = { answer: 'decline', ask: (params) => cs.askPerson(params.message) };
    return cs;
  }

  get planner(): string {
    return this.provider ? `model (${this.provider.id})` : `nearest case in ${this.suite.suite} (no model)`;
  }

  private emitEvent(e: ConsoleEvent) {
    this.emit('event', e);
  }

  private askPerson(message: string): Promise<{ action: 'accept' | 'decline' | 'cancel' }> {
    const id = randomUUID();
    this.emitEvent({ type: 'elicitation', data: { id, message } });
    return new Promise((resolve) => this.pending.set(id, { resolve }));
  }

  answer(id: string, action: 'accept' | 'decline' | 'cancel'): boolean {
    const p = this.pending.get(id);
    if (!p) return false;
    this.pending.delete(id);
    p.resolve({ action });
    this.emitEvent({ type: 'elicitation-answered', data: { id, action } });
    return true;
  }

  async say(text: string): Promise<{ turn: Turn; findings: Finding[]; match?: Match }> {
    let match: Match | undefined;
    const orchestrator = this.provider ? llmOrchestrator(this.provider) : nearestCasePlanner(this.suite, (m) => (match = m));
    const mode = this.provider ? 'llm' : 'scripted';
    const revision = this.session.revision;
    const turn = await playTurn(this.session, orchestrator, mode, this.suite.latencyModel, this.turns, { id: `console#${this.turns.length + 1}`, utterance: text, heard: text });
    this.turns.push(turn);
    if (this.session.revision !== revision) this.emitEvent({ type: 'tools', data: { revision: this.session.revision, tools: this.session.tools } });
    const trace = { suite: this.suite.suite, caseId: 'console', variant: 'clean', orchestrator: mode, principal: this.session.options.principal, client: { elicitation: true }, server: this.session.serverInfo(), turns: this.turns, startedAt: '' } as Trace;
    const c = match?.case ?? this.suite.cases[0]!;
    const selected = new Set(turnChecksFor(this.suite, c));
    const findings = LIVE.filter((id) => selected.has(id)).flatMap((id) => TURN_CHECKS.get(id)?.run({ suite: this.suite, case: c, trace, turns: [turn], tools: this.session.tools }) ?? []);
    const planner = match ? { caseId: match.case.id, score: Math.round(match.score * 100) / 100 } : this.provider ? { model: this.provider.id } : { caseId: null };
    this.emitEvent({ type: 'turn', data: { turn, planner, firstAudio: firstAudio(turn), findings } });
    return { turn, findings, ...(match ? { match } : {}) };
  }

  async close() {
    for (const [id] of this.pending) this.answer(id, 'cancel');
    await this.session.close();
  }
}

export const LIVE_CHECKS = LIVE.map((id) => CHECKS.find((c) => c.id === id)!);
