/**
 * The orchestrator stands in for Alexa+'s own planner, which is not available
 * outside Amazon's partner program (hackathon FAQ). Three modes, one interface
 * (docs/04_ARCHITECTURE.md §Packages, D-002):
 *
 *   scripted  the suite names the tool call; no model, no cost, fully deterministic.
 *             Tests what the SERVER does: latency, speakability, consent, protocol.
 *             Perturbations reach the server through argument values (docs/03).
 *   llm       a real model picks tools from the live tool list.
 *             Tests whether the tool SURFACE is understandable.
 *   replay    llm runs recorded as cassettes and replayed byte-for-byte.
 *             What CI and judges run: deterministic, no keys needed.
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolResult, Turn } from './trace';

export type OrchestratorMode = 'scripted' | 'llm' | 'replay';

export interface TurnContext {
  /** Utterance after ASR perturbation. */
  heard: string;
  /** The server's tool list as of this turn. */
  tools: Tool[];
  history: Turn[];
  /** Instrumented: records a span and a ToolCallRecord on the current turn. */
  callTool(name: string, args: Record<string, unknown>): Promise<ToolResult>;
  /** Records a planning span (one model call) of `ms` on the current turn. */
  recordPlan?(ms: number, name?: string): void;
}

export interface Orchestrator {
  readonly mode: OrchestratorMode;
  /** Run one turn to completion and return what the assistant says. */
  respond(ctx: TurnContext): Promise<{ spoken: string }>;
}

/** Provider-neutral shape, modelled on the Bedrock Converse API so the Bedrock adapter is thin. */
export interface ModelRequest {
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: ModelContent[] }>;
  tools: Array<{ name: string; description: string; inputSchema: unknown }>;
  maxTokens: number;
}

export type ModelContent =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; toolUseId: string; text: string; isError: boolean };

export interface ModelResponse {
  content: ModelContent[];
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens' | 'other';
  usage?: { inputTokens: number; outputTokens: number };
}

/** Adapters: bedrock (default, AWS Builder). anthropic and openai-compatible only as fallback (R-06). */
export interface ModelProvider {
  readonly id: string;
  /** `durationMs` is set by replay (the recorded time) and recording providers. */
  converse(req: ModelRequest): Promise<ModelResponse & { durationMs?: number }>;
}

/** Replay cassette: request hash → recorded response and its duration. Checked into suites/cassettes/. */
export interface CassetteEntry {
  request: ModelRequest;
  response: ModelResponse;
  /** Wall clock of the recorded call; replayed as the plan span (docs/03 §Latency model). */
  durationMs: number;
}

export interface Cassette {
  provider: string;
  model: string;
  recordedAt: string;
  /** By request hash. A request asked again (the same first turns in two cases) keeps every answer, in order. */
  entries: Record<string, CassetteEntry | CassetteEntry[]>;
}
