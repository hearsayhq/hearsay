/**
 * Ask the person before anything consequential commits (docs/06 §Consent tiers) —
 * and only then. Consent is for your customers: grant once, act freely within the
 * limit, confirm only when money moves (D-022).
 *
 * Strong tier: elicitation, rendered by the host; the model never sees the answer.
 * Without client elicitation this returns "unavailable": fail closed, or fall back
 * to the verbal tier with VerbalTokens (graded warn by consent.path).
 * Fixes: consent.path, consent.decline_holds, consent.states_details, consent.over_confirmation.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { assertSpeakable } from './speak';

export type ConfirmOutcome = 'accepted' | 'declined' | 'cancelled' | 'unavailable' | 'not-needed';

export interface ConfirmWhen {
  /** Does this action commit something (money moves, an order is placed, data is deleted)? Default true. */
  commits?: boolean;
  /** Is it covered by an active mandate the person already granted? Default false. */
  insideMandate?: boolean;
}

/**
 * `question` must state what will happen and how much ("Place the order: two cartons of milk, $7.40?").
 * Returns "not-needed" without asking for an action that commits nothing inside an active mandate.
 */
export async function confirm(server: McpServer, question: string, when: ConfirmWhen = {}): Promise<ConfirmOutcome> {
  const { commits = true, insideMandate = false } = when;
  if (!commits && insideMandate) return 'not-needed';
  assertSpeakable(question);
  if (!server.server.getClientCapabilities()?.elicitation) return 'unavailable';
  const r = await server.server.elicitInput({ message: question, requestedSchema: { type: 'object', properties: {} } });
  return r.action === 'accept' ? 'accepted' : r.action === 'decline' ? 'declined' : 'cancelled';
}
