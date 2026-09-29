import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { assertSpeakable } from './speak';

/**
 * A refusal as an ordinary tool result: isError plus one spoken sentence that says
 * what the person can do. `code` lets programs (and Hearsay's `refusal`
 * expectation) tell refusals apart without parsing the sentence.
 * Fixes: lint.error_actionable, protocol.refusal_as_result.
 */
export const MAX_REFUSAL_CHARS = 200;

export function refuse(sentence: string, code?: string, details: Record<string, unknown> = {}): CallToolResult {
  assertSpeakable(sentence);
  if (sentence.length > MAX_REFUSAL_CHARS) throw new Error(`Refusal too long for voice: ${sentence.length} characters`);
  return {
    isError: true,
    content: [{ type: 'text', text: sentence }],
    ...(code ? { structuredContent: { code, ...details } } : {}),
  };
}
