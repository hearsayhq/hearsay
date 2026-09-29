/**
 * The mandate boundary as one call (docs/06): authorize() from @hearsayhq/mandate,
 * with its refusal turned into a spoken tool result. Returns undefined when the call
 * may proceed. Fixes: mandate.*.
 */
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { authorize, MandateError, type Mandate, type MandateCall } from '@hearsayhq/mandate';
import { refuse } from './refuse';

export function withMandate(mandate: Mandate | undefined, call: MandateCall, now = Date.now()): CallToolResult | undefined {
  try {
    authorize(mandate, call, now);
    return undefined;
  } catch (e) {
    if (e instanceof MandateError) return refuse(e.spoken, e.code, e.details);
    throw e;
  }
}
