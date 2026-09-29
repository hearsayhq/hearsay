/**
 * The orchestrator stands in for Alexa+'s own planner, which is not available
 * outside Amazon's partner program (hackathon FAQ). Three modes, one interface
 * (docs/04_ARCHITECTURE.md §Orchestrators):
 *
 *   scripted  the suite names the tool call; no model, no cost, fully deterministic.
 *             Tests what the SERVER does: latency, speakability, mandate, protocol.
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

/** Adapters: bedrock (default, AWS Builder), anthropic, openai-compatible (e.g. DeepSeek). */
export interface ModelProvider {
  readonly id: string;
  converse(req: ModelRequest): Promise<ModelResponse>;
}

/** Replay cassette: request hash → recorded response. Checked into suites/cassettes/. */
export interface Cassette {
  provider: string;
  model: string;
  recordedAt: string;
  entries: Record<string, ModelResponse>;
}
