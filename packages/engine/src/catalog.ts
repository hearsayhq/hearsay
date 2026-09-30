/**
 * Every check and perturbation the engine knows, by stable id. The single source
 * for suite validation, CLI output and docs/05_CHECK_CATALOG.md. A check moves
 * from "planned" to "implemented" only together with a fixture built to fail it
 * (docs/08_EVAL_AND_TEST_PLAN.md).
 */
export type CheckCategory = 'protocol' | 'suite' | 'lint' | 'latency' | 'speak' | 'asr' | 'case' | 'consent' | 'mandate';
export type Severity = 'error' | 'warn' | 'info';
export type Priority = 'must' | 'should' | 'could';

/** The four questions a listener asks, plus the precondition (docs/00). The precondition is labelled as one, never as a fifth question. */
export type Question = 'connect' | 'hear' | 'wait' | 'listen' | 'agree';

export const QUESTIONS: Readonly<Record<Question, string>> = {
  connect: 'Precondition: Can it connect?',
  hear: 'Did it hear me right?',
  wait: 'Do I have to wait?',
  listen: 'Can I listen to this?',
  agree: 'Did I agree?',
};

export const QUESTION_ORDER: readonly Question[] = ['connect', 'hear', 'wait', 'listen', 'agree'];

/** Where a rule comes from. Amazon thresholds are fixed; suites may only tune Hearsay's own. */
export interface Source {
  kind: 'amazon-fr' | 'mcp-spec' | 'hearsay';
  ref: string;
  url?: string;
}

export interface Threshold {
  severity: Severity;
  /** The condition that produces a finding at this severity. */
  when: string;
  /** Numeric limit, when the rule has one. */
  value?: number;
  /** Suite `budget` key that overrides `value`. Only ever set on Hearsay-sourced thresholds. */
  budgetKey?: 'firstAudioMs' | 'spokenChars' | 'listItems';
  source: Source;
}

export interface CheckSpec {
  id: string;
  category: CheckCategory;
  /** Default grouping; case.expect findings take the question of the failed field. */
  question: Question;
  /** server: runs once per suite (lint, probes). turn: runs on every turn of every trace. */
  scope: 'server' | 'turn';
  priority: Priority;
  status: 'planned' | 'implemented';
  summary: string;
  thresholds: readonly Threshold[];
  /** Runs on every case without being listed in a suite. */
  alwaysOn?: true;
  /** Only runs against servers that expose this profile (docs/05 §Mandate profile). */
  profile?: 'mandate';
  /** The @hearsayhq/kit block that fixes a finding of this check (docs/05 §Kit blocks). */
  kit?: 'speak' | 'refuse' | 'confirm' | 'withMandate';
}

const AMAZON = 'https://developer.amazon.com/docs/alexaplus/add-ons';
const MCP = 'https://modelcontextprotocol.io/specification/2025-11-25';

const amazonFr = (ref: string): Source => ({ kind: 'amazon-fr', ref: `Functional requirements: ${ref}`, url: `${AMAZON}/functional-requirements.html` });
const amazonQuickstart = (ref: string): Source => ({ kind: 'amazon-fr', ref: `MCP Toolkit quickstart: ${ref}`, url: `${AMAZON}/mcp-toolkit-quickstart.html` });
const amazonLifecycle = (ref: string): Source => ({ kind: 'amazon-fr', ref: `Client lifecycle: ${ref}`, url: `${AMAZON}/mcp-toolkit-client-lifecycle.html` });
const mcpSpec = (page: string, ref: string): Source => ({ kind: 'mcp-spec', ref: `MCP 2025-11-25 ${page}: ${ref}`, url: `${MCP}/${page}` });
const hearsay = (ref: string): Source => ({ kind: 'hearsay', ref });

const t = (severity: Severity, when: string, source: Source, extra: Partial<Threshold> = {}): Threshold => ({ severity, when, source, ...extra });

type Def = Omit<CheckSpec, 'category' | 'status'> & { status?: CheckSpec['status'] };
const c = (d: Def): CheckSpec => ({ status: 'planned', ...d, category: d.id.split('.')[0] as CheckCategory });

export const CHECKS: readonly CheckSpec[] = [
  // ── Can it connect? ────────────────────────────────────────────────────────
  c({
    id: 'protocol.version', status: 'implemented', question: 'connect', scope: 'server', priority: 'must',
    summary: 'Speaks MCP 2025-11-25 over Streamable HTTP, and still works when a client offers 2025-03-26.',
    thresholds: [
      t('error', 'cannot negotiate 2025-11-25 over Streamable HTTP when the client offers it', amazonQuickstart('2025-11-25 over Streamable HTTP is required')),
      t('warn', 'fails to initialize or list tools when the client offers 2025-03-26', amazonLifecycle('the example handshake offers 2025-03-26 (friction log #2)')),
    ],
  }),
  c({
    id: 'suite.integrity', status: 'implemented', question: 'connect', scope: 'server', priority: 'must', alwaysOn: true,
    summary: 'The suites a run judges by are the ones that were locked.',
    thresholds: [t('error', 'a locked suite changed since `hearsay lock`', hearsay('docs/03 §Holdouts and the lock'))],
  }),
  c({
    id: 'protocol.list_changed', status: 'implemented', question: 'connect', scope: 'turn', priority: 'should',
    summary: 'A tool list that changes during a session is announced with tools/list_changed.',
    thresholds: [t('warn', 'the tool list differs between two turns of one session without a declared capability and a notification', mcpSpec('server/tools', 'list changed notification'))],
  }),

  // ── Did it hear me right? ──────────────────────────────────────────────────
  c({
    id: 'asr.robust', status: 'implemented', question: 'hear', scope: 'turn', priority: 'must', kit: 'speak',
    summary: 'A misheard variant leads to the same effect, a question back, or a reply that says what was heard.',
    thresholds: [
      t('error', 'a variant silently causes a different effect, or claims success without any effect', amazonFr('synonyms and alternate spellings in parameter descriptions and enums')),
    ],
  }),
  c({
    id: 'lint.tool_names', status: 'implemented', question: 'hear', scope: 'server', priority: 'must',
    summary: 'Tool names are valid and not confusable with each other.',
    thresholds: [
      t('warn', 'a name falls outside [A-Za-z0-9_.-]{1,128}', mcpSpec('server/tools', 'tool names')),
      t('warn', 'two tools name the same words after synonym folding (set/apply/update, get/list/show, start/create/add, stop/cancel/delete) and plurals', amazonFr('each tool maps to a distinct customer intent')),
    ],
  }),
  c({
    id: 'lint.descriptions', status: 'implemented', question: 'hear', scope: 'server', priority: 'must',
    summary: 'Every tool and parameter has a description a model can map speech onto.',
    thresholds: [t('warn', 'a tool description is missing or under 20 characters, or a parameter has none', amazonFr('clear, unambiguous tool descriptions'))],
  }),
  c({
    id: 'lint.schema_constraints', status: 'implemented', question: 'hear', scope: 'server', priority: 'should',
    summary: 'Input schemas are valid, declare required parameters, and use enums and bounds.',
    thresholds: [
      t('error', 'an inputSchema is not valid JSON Schema, or a required parameter is not declared', amazonFr('valid JSON Schema inputSchema with all required parameters')),
      t('warn', 'a numeric parameter has no bounds, or a closed set is not an enum', hearsay('docs/05 lint.schema_constraints')),
    ],
  }),
  c({
    id: 'case.expect', status: 'implemented', question: 'hear', scope: 'turn', priority: 'must', alwaysOn: true,
    summary: 'What the suite says should happen, happens.',
    thresholds: [t('error', 'an expectation of the case is not met', hearsay('the suite author\'s expectation (docs/03 §Expectations)'))],
  }),

  // ── Do I have to wait? ─────────────────────────────────────────────────────
  c({
    id: 'latency.tool', status: 'implemented', question: 'wait', scope: 'turn', priority: 'must',
    summary: 'Each tool round trip stays under 500 ms.',
    thresholds: [t('error', 'a tools/call round trip exceeds 500 ms', amazonQuickstart('round-trip response latency under 500 ms'), { value: 500 })],
  }),
  c({
    id: 'latency.first_audio', status: 'implemented', question: 'wait', scope: 'turn', priority: 'must',
    summary: 'Modeled time to first audio stays within budget. In scripted mode this is a lower bound.',
    thresholds: [t('warn', 'modeled asr + plan + tools + speak exceeds the budget', hearsay('docs/03 §Latency model'), { value: 1500, budgetKey: 'firstAudioMs' })],
  }),

  // ── Can I listen to this? ──────────────────────────────────────────────────
  c({
    id: 'speak.no_structured_dump', status: 'implemented', question: 'listen', scope: 'turn', priority: 'must', kit: 'speak',
    summary: 'No JSON, markup, ids, tool names or tool-description text reaches the spoken reply.',
    thresholds: [
      t('error', 'the reply contains JSON, a markdown table or heading, a URL, a UUID, an internal id, or a tool name', amazonFr('no API codes, tool names, JSON or internal ids in customer-facing responses')),
      t('error', 'the reply contains 8 or more consecutive words from a tool description', hearsay('docs/05 speak.no_structured_dump')),
    ],
  }),
  c({
    id: 'speak.length', status: 'implemented', question: 'listen', scope: 'turn', priority: 'must', kit: 'speak',
    summary: 'Spoken replies stay short enough to listen to.',
    thresholds: [
      t('error', 'the reply is longer than 400 characters (about 30 seconds at 150 words per minute)', amazonFr('voice responses under 30 seconds'), { value: 400 }),
      t('warn', 'the reply is longer than the budget', hearsay('docs/05 speak.length'), { value: 280, budgetKey: 'spokenChars' }),
    ],
  }),
  c({
    id: 'speak.lists', status: 'implemented', question: 'listen', scope: 'turn', priority: 'should', kit: 'speak',
    summary: 'Lists are short and offer more.',
    thresholds: [
      t('error', 'more than 5 options are read out', amazonFr('at most 5 options, with pagination'), { value: 5 }),
      t('warn', 'more than the budget are read out without an offer to continue', hearsay('docs/05 speak.lists'), { value: 3, budgetKey: 'listItems' }),
    ],
  }),
  c({
    id: 'lint.error_actionable', status: 'implemented', question: 'listen', scope: 'turn', priority: 'must', kit: 'refuse',
    summary: 'Error results are one sentence that says what the person can do.',
    thresholds: [
      t('error', 'the error text contains a stack trace, an error code or an internal id', amazonFr('no API codes or technical jargon in customer-facing responses')),
      t('warn', 'the error text is over 200 characters or names no next step', amazonFr('an actionable next step for every error'), { value: 200 }),
    ],
  }),
  c({
    id: 'protocol.refusal_as_result', status: 'implemented', question: 'listen', scope: 'turn', priority: 'must', kit: 'refuse',
    summary: 'Refusals are ordinary tool results with isError and a spoken sentence, never protocol errors.',
    thresholds: [
      t('error', 'a tools/call is answered with a JSON-RPC error, or with isError text starting "MCP error -32602"', amazonFr('every tool in tools/list must be invocable')),
    ],
  }),

  // ── Did I agree? (any server) ──────────────────────────────────────────────
  c({
    id: 'consent.path', status: 'implemented', question: 'agree', scope: 'turn', priority: 'must', kit: 'confirm',
    summary: 'A consequential action commits only after the person said yes, preferably through elicitation.',
    thresholds: [
      t('error', 'the action commits without an accepted elicitation or a valid verbal token', amazonFr('explicit confirmation before payment, cancellation or deletion')),
      t('warn', 'the action commits through the verbal path on a client without elicitation (a model can hallucinate a yes)', hearsay('docs/06 §Consent tiers')),
      t('warn', 'the server uses the verbal path although the client declared elicitation', hearsay('docs/06 §Consent tiers: the server chose the weaker path')),
      t('info', 'the client has no elicitation and the server refuses to commit: safe, but unusable on hosts without elicitation', hearsay('docs/06 §Consent tiers')),
    ],
  }),
  c({
    id: 'consent.decline_holds', status: 'implemented', question: 'agree', scope: 'turn', priority: 'must', kit: 'confirm',
    summary: 'A declined or cancelled confirmation changes nothing.',
    thresholds: [t('error', 'committed state changes after the person declined or cancelled', amazonFr('explicit confirmation before high-consequence actions'))],
  }),
  c({
    id: 'consent.states_details', status: 'implemented', question: 'agree', scope: 'turn', priority: 'must', kit: 'confirm',
    summary: 'The confirmation says what and how much.',
    thresholds: [t('error', 'the confirmation question does not state the amount and the items', amazonFr('confirmation with key details'))],
  }),
  c({
    id: 'consent.verbal_token', status: 'implemented', question: 'agree', scope: 'server', priority: 'must', kit: 'confirm',
    summary: 'A verbal confirmation token is bound, short-lived and single-use.',
    thresholds: [
      t('error', 'the token is not bound to items and amount, lives longer than 60 s, can be replayed, or survives a cart change', hearsay('docs/05 §Verbal confirmation'), { value: 60 }),
    ],
  }),
  c({
    id: 'consent.misheard_amount', status: 'implemented', question: 'agree', scope: 'turn', priority: 'must', kit: 'confirm',
    summary: 'A misheard amount never commits.',
    thresholds: [
      t('error', 'a perturbed amount commits: it was neither refused nor stated in a confirmation the person could decline', amazonFr('explicit verbal confirmation for voice-only transactions')),
    ],
  }),
  c({
    id: 'consent.over_confirmation', status: 'implemented', question: 'agree', scope: 'turn', priority: 'must', kit: 'confirm',
    summary: 'Confirmation only when money moves: never for reads, never for what an active mandate already covers.',
    thresholds: [
      t('warn', 'a confirmation is asked during a call to a read-only tool', amazonFr('confirmation before high-consequence actions (payment, cancellation, deletion)')),
      t('warn', 'a confirmation is asked for an action that commits nothing inside an active mandate', hearsay('docs/06: grant once, act freely within the limit, confirm only when money moves')),
    ],
  }),
  c({
    id: 'lint.destructive_annotated', status: 'implemented', question: 'agree', scope: 'server', priority: 'must',
    summary: 'Annotations tell the truth about side effects.',
    thresholds: [
      t('error', 'a tool declares readOnlyHint: true but two identical reads differ', mcpSpec('server/tools', 'tool annotations')),
      t('warn', 'a tool changes state without explicit annotations', hearsay('docs/05 lint.destructive_annotated')),
    ],
  }),

  // ── Did I agree? (mandate profile) ─────────────────────────────────────────
  c({
    id: 'mandate.schema_ignoring_caller', status: 'implemented', question: 'agree', scope: 'server', priority: 'must', kit: 'withMandate', profile: 'mandate',
    summary: 'Calls that ignore the advertised schema are refused by authorize(), not by the schema.',
    thresholds: [t('error', 'a value outside the advertised enum, or an extra field, is not refused with a mandate code', hearsay('docs/06: a schema communicates authority, it never confers it'))],
  }),
  c({
    id: 'mandate.version_race', status: 'implemented', question: 'agree', scope: 'server', priority: 'must', kit: 'withMandate', profile: 'mandate',
    summary: 'Nothing staged under an older mandate version commits.',
    thresholds: [
      t('error', 'a call naming a stale version is not refused with POLICY_CHANGED, or a line staged before a narrowing commits', hearsay('docs/06 §Lifecycle')),
    ],
  }),
  c({
    id: 'mandate.expiry', status: 'implemented', question: 'agree', scope: 'server', priority: 'must', kit: 'withMandate', profile: 'mandate',
    summary: 'An expired mandate is refused without any client action, with a spoken sentence.',
    thresholds: [t('error', 'a call after expiry is not refused with MANDATE_EXPIRED and a spoken sentence', amazonFr('a clear expiry message after the session'))],
  }),
  c({
    id: 'mandate.injection', status: 'implemented', question: 'agree', scope: 'turn', priority: 'should', kit: 'withMandate', profile: 'mandate',
    summary: 'Instructions inside tool results do not widen the scope.',
    thresholds: [t('error', 'the scope or tool list changes after an injected result, or the compromised model\'s out-of-scope call is not refused', hearsay('docs/06 §Honest limits'))],
  }),
  c({
    id: 'mandate.principal_bound', status: 'implemented', question: 'agree', scope: 'server', priority: 'should', kit: 'withMandate', profile: 'mandate',
    summary: 'A mandate belongs to the person who granted it, across sessions.',
    thresholds: [
      t('error', 'another principal can use the mandate', hearsay('docs/06 §Principal')),
      t('warn', 'a new session of the same principal does not see the mandate', amazonFr('preserve context across the session')),
    ],
  }),
];

export interface PerturbationSpec {
  id: string;
  priority: Priority;
  status: 'planned' | 'implemented';
  /** Scripted mode only uses perturbations that change argument values (docs/03). */
  scripted: boolean;
  example: string;
}

const p = (id: string, priority: Priority, scripted: boolean, example: string, status: PerturbationSpec['status'] = 'implemented'): PerturbationSpec => ({ id, priority, status, scripted, example });

export const PERTURBATIONS: readonly PerturbationSpec[] = [
  p('asr.number_confusion', 'must', true, '"fifteen" → "fifty", "thirteen" → "thirty"'),
  p('asr.homophones', 'must', true, '"for" → "four", "two" → "to", "eight" → "ate"'),
  p('asr.compound_split', 'should', true, '"living room" → "livingroom", "bedroom" → "bed room"'),
  p('asr.self_correction', 'should', false, '"order two, no, three cartons of milk"'),
  p('asr.roundtrip', 'should', true, 'recorded by `hearsay gen-variants`: TTS → noise, phone band → STT'),
];

export const CHECK_IDS = new Set(CHECKS.map((x) => x.id));
export const PERTURBATION_IDS = new Set(PERTURBATIONS.map((x) => x.id));

const RANK: Record<Severity, number> = { info: 0, warn: 1, error: 2 };

/** Highest severity a check can produce. */
export const maxSeverity = (check: CheckSpec): Severity =>
  check.thresholds.reduce<Severity>((m, x) => (RANK[x.severity] > RANK[m] ? x.severity : m), 'info');
