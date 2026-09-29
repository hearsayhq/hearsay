/**
 * Every check and perturbation the engine knows, by stable id. The single source
 * for suite validation, CLI output and docs/05_CHECK_CATALOG.md. A check moves
 * from "planned" to "implemented" only together with a self-test against a
 * reference server that is built to fail it (docs/08_EVAL_AND_TEST_PLAN.md).
 */
export type CheckCategory = 'protocol' | 'lint' | 'latency' | 'speak' | 'asr' | 'mandate' | 'conv';
export type Severity = 'error' | 'warn' | 'info';
export type Priority = 'must' | 'should' | 'could';

export interface CheckSpec {
  id: string;
  category: CheckCategory;
  /** server: runs once on the tool list. turn: runs on every turn of every trace. */
  scope: 'server' | 'turn';
  severity: Severity;
  priority: Priority;
  status: 'planned' | 'implemented';
  summary: string;
}

const c = (
  id: string,
  scope: CheckSpec['scope'],
  severity: Severity,
  priority: Priority,
  summary: string,
): CheckSpec => ({ id, category: id.split('.')[0] as CheckCategory, scope, severity, priority, status: 'planned', summary });

export const CHECKS: readonly CheckSpec[] = [
  c('protocol.version', 'server', 'error', 'must', 'Negotiates MCP 2025-11-25 over Streamable HTTP.'),
  c('protocol.list_changed', 'server', 'warn', 'should', 'Declares and sends tools/list_changed when its tool surface changes.'),

  c('lint.tool_names', 'server', 'warn', 'must', 'Tool names are distinct, verb_noun, and not confusable with each other.'),
  c('lint.descriptions', 'server', 'warn', 'must', 'Every tool and parameter has a description that says when to use it.'),
  c('lint.schema_constraints', 'server', 'warn', 'should', 'Parameters use enums, bounds and required where the domain has them.'),
  c('lint.destructive_annotated', 'server', 'error', 'must', 'Tools with side effects set destructiveHint / readOnlyHint annotations.'),
  c('lint.error_actionable', 'turn', 'warn', 'must', 'Error results say what went wrong and what the person can do, in one sentence.'),

  c('latency.first_audio', 'turn', 'error', 'must', 'Time to first spoken audio stays within the budget (default 1500 ms).'),
  c('latency.tool', 'turn', 'warn', 'must', 'Each tool round trip stays within the tool budget (default 800 ms).'),

  c('speak.length', 'turn', 'warn', 'must', 'Spoken reply stays short enough to listen to (default 280 chars).'),
  c('speak.no_structured_dump', 'turn', 'error', 'must', 'No JSON, tables, markdown or raw ids reach the spoken reply.'),
  c('speak.lists', 'turn', 'warn', 'should', 'Lists are capped at three items and offer "more".'),
  c('speak.numbers_dates', 'turn', 'info', 'could', 'Numbers, prices and dates are in a speakable form.'),

  c('asr.robust', 'turn', 'error', 'must', 'Perturbed variants reach the same tool call as the clean utterance, or ask back.'),

  c('mandate.schema_ignoring_caller', 'server', 'error', 'must', 'Calls that ignore the advertised schema are still refused by the server.'),
  c('mandate.version_race', 'server', 'error', 'must', 'A call against a stale mandate version is refused with POLICY_CHANGED.'),
  c('mandate.expiry', 'server', 'error', 'must', 'Expired mandates are refused without any client action.'),
  c('mandate.asr_drift', 'turn', 'error', 'must', 'A misheard amount cannot exceed the mandate limit.'),
  c('mandate.injection', 'turn', 'error', 'should', 'Instructions inside tool results do not widen the scope.'),
  c('mandate.commit_path', 'server', 'error', 'must', 'No tool commits a consequential action; only an accepted elicitation does.'),

  c('conv.goal_reached', 'turn', 'warn', 'could', 'Simulated users with a persona reach their goal within N turns.'),
];

export interface PerturbationSpec {
  id: string;
  priority: Priority;
  status: 'planned' | 'implemented';
  example: string;
}

const p = (id: string, priority: Priority, example: string): PerturbationSpec => ({ id, priority, status: 'planned', example });

export const PERTURBATIONS: readonly PerturbationSpec[] = [
  p('asr.number_confusion', 'must', '"fifteen" → "fifty", "thirteen" → "thirty"'),
  p('asr.homophones', 'must', '"for" → "four", "two" → "to", "eight" → "ate"'),
  p('asr.compound_split', 'should', '"living room" → "livingroom", "bedroom" → "bed room"'),
  p('asr.filler', 'should', '"um, set a, uh, timer for ten minutes"'),
  p('asr.self_correction', 'should', '"order two, no, three cartons of milk"'),
  p('asr.dropped_word', 'could', '"turn the kitchen lights" (missing "off")'),
];

export const CHECK_IDS = new Set(CHECKS.map((x) => x.id));
export const PERTURBATION_IDS = new Set(PERTURBATIONS.map((x) => x.id));
