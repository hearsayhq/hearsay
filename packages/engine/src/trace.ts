/**
 * The trace is the product's single data model (docs/03_DOMAIN_AND_STATE.md).
 * CLI, web UI, reports and every check read the same objects; nothing renders
 * or judges from anything else.
 */
import type { OrchestratorMode } from './orchestrator';

/** Where time went inside one spoken turn. Times are ms relative to turn start. */
export type SpanKind =
  | 'asr' // speech-to-text, real or simulated
  | 'plan' // model deciding what to do (0 in scripted mode)
  | 'tool' // one MCP tools/call round trip
  | 'elicitation' // server asked the human through the host
  | 'speak'; // text-to-speech until first audio

export interface Span {
  kind: SpanKind;
  name: string;
  startMs: number;
  endMs: number;
  /** true for asr and speak in scripted and replay runs: a constant from the latency model, not a measurement. */
  modeled?: boolean;
  attrs?: Record<string, unknown>;
}

export interface ToolResult {
  isError: boolean;
  /** Text content blocks joined; what a model would read. */
  text: string;
  structuredContent?: unknown;
  /** Refusal code from `structuredContent.code` on an isError result (docs/03 §Expectations). */
  errorCode?: string;
  /** Set when tools/call was answered with a JSON-RPC error instead of a result. */
  protocolError?: { code: number; message: string };
}

export interface ToolCallRecord {
  tool: string;
  args: Record<string, unknown>;
  result: ToolResult;
  latencyMs: number;
}

export interface ElicitationRecord {
  message: string;
  requestedSchema?: unknown;
  /** How the simulated human answered (docs/06 §Consent tiers). */
  action: 'accept' | 'decline' | 'cancel';
  content?: Record<string, unknown>;
}

export interface Turn {
  id: string;
  /** What the person said. */
  utterance: string;
  /** What the system heard, after ASR perturbation. Equal to utterance for clean runs. */
  heard: string;
  spans: Span[];
  toolCalls: ToolCallRecord[];
  elicitations: ElicitationRecord[];
  /** What the assistant said back. */
  spoken: string;
  /** Tool list version seen at turn start; changes when the server sends tools/list_changed. */
  toolListRevision: number;
  /** Set on turns replayed from an `after` chain: the setup case's id. Not judged for this case. */
  setupOf?: string;
}

export interface ServerInfo {
  url: string;
  name?: string;
  version?: string;
  protocolVersion?: string;
  capabilities?: Record<string, unknown>;
}

export interface Trace {
  suite: string;
  caseId: string;
  /** "clean" or a perturbation id such as "asr.number_confusion#2". */
  variant: string;
  /** What the perturbation changed, word for word (empty for clean). */
  edits?: Array<{ from: string; to: string }>;
  orchestrator: OrchestratorMode;
  /** Who the server should think is speaking: a fresh bearer token per case × variant (D-009). */
  principal: string;
  /** Capabilities the engine declared at initialize for this session. */
  client: { elicitation: boolean };
  server: ServerInfo;
  turns: Turn[];
  startedAt: string;
}
