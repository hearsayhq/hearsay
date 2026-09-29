import { MandateError } from './errors';
import type { Mandate, MandateCall } from './types';

/**
 * The enforcement point. Ported from webMCP server/core/policy.ts.
 * Every mandate-scoped tool call passes through `authorize`; there is no second path.
 */

/** A mandate expires by the clock, not by a client call. Settle before every read. */
export function settleExpiry(mandate: Mandate | undefined, now: number): boolean {
  if (!mandate || mandate.status !== 'ACTIVE' || now < mandate.expiresAt) return false;
  mandate.status = 'EXPIRED';
  mandate.endedAt = now;
  mandate.endedReason = 'EXPIRED';
  return true;
}

/**
 * Refuse anything the person did not delegate, in the order that produces the
 * most useful error: is there authority, is it alive, is it the version the
 * caller read, does it cover this tool and resource, does it cover this amount.
 */
export function authorize(mandate: Mandate | undefined, call: MandateCall, now: number): Mandate {
  settleExpiry(mandate, now);

  if (!mandate || mandate.status === 'REVOKED') {
    throw new MandateError(
      'NO_ACTIVE_MANDATE',
      'No active mandate for this session.',
      "I don't have permission for that right now. You can give it by saying what I may do and for how long.",
      { status: mandate?.status ?? 'NONE' },
    );
  }
  if (mandate.status === 'EXPIRED') {
    throw new MandateError(
      'MANDATE_EXPIRED',
      'The mandate expired.',
      'The permission you gave me has run out. Say it again if you want me to continue.',
      { expiredAt: mandate.expiresAt },
    );
  }
  if (call.mandateVersion !== mandate.version) {
    throw new MandateError(
      'POLICY_CHANGED',
      `Call made against mandate v${call.mandateVersion}; current is v${mandate.version}.`,
      'Your permissions just changed, so I stopped. Want me to try again with the new ones?',
      { calledVersion: call.mandateVersion, currentVersion: mandate.version },
    );
  }
  if (!mandate.tools.includes(call.tool)) {
    throw new MandateError(
      'OUT_OF_SCOPE',
      `Tool "${call.tool}" is not in the mandate.`,
      "That's outside what you allowed me to do.",
      { tool: call.tool, allowedTools: mandate.tools },
    );
  }
  if (call.resourceId !== undefined && !mandate.resourceIds.includes(call.resourceId)) {
    throw new MandateError(
      'OUT_OF_SCOPE',
      `Resource "${call.resourceId}" is not in the mandate.`,
      "That item isn't on the list you allowed.",
      { resourceId: call.resourceId, allowedResourceIds: mandate.resourceIds },
    );
  }
  const limits = mandate.limits;
  if (call.amountMinor !== undefined && limits) {
    if (limits.perCallMinor !== undefined && call.amountMinor > limits.perCallMinor) {
      throw new MandateError(
        'LIMIT_EXCEEDED',
        `Amount ${call.amountMinor} exceeds per-call limit ${limits.perCallMinor}.`,
        'That costs more than the limit you set for a single order.',
        { amountMinor: call.amountMinor, perCallMinor: limits.perCallMinor, currency: limits.currency },
      );
    }
    if (limits.totalMinor !== undefined && mandate.spentMinor + call.amountMinor > limits.totalMinor) {
      throw new MandateError(
        'LIMIT_EXCEEDED',
        `Amount ${call.amountMinor} would exceed total limit ${limits.totalMinor} (spent ${mandate.spentMinor}).`,
        "That would go over the total budget you gave me.",
        { amountMinor: call.amountMinor, spentMinor: mandate.spentMinor, totalMinor: limits.totalMinor, currency: limits.currency },
      );
    }
  }
  return mandate;
}
