/**
 * Ask the person before anything consequential commits (docs/06 §Consent tiers).
 * Strong tier: elicitation, rendered by the host; the model never sees the answer.
 * Without client elicitation this fails closed ("unavailable"); the verbal-token
 * tier arrives in M2b. Fixes: consent.path, consent.decline_holds, consent.states_details.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { assertSpeakable } from './speak';

export type ConfirmOutcome = 'accepted' | 'declined' | 'cancelled' | 'unavailable';

/** `question` must state what will happen and how much ("Turn off all fourteen devices in the house?"). */
export async function confirm(server: McpServer, question: string): Promise<ConfirmOutcome> {
  assertSpeakable(question);
  if (!server.server.getClientCapabilities()?.elicitation) return 'unavailable';
  const r = await server.server.elicitInput({ message: question, requestedSchema: { type: 'object', properties: {} } });
  return r.action === 'accept' ? 'accepted' : r.action === 'decline' ? 'declined' : 'cancelled';
}
