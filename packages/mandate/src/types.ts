/**
 * The mandate model, ported from the WebMCP Mandate Compiler
 * (github.com/HarzerHeribert/webMCP, server/core/types.ts) and generalised from
 * "records × fields" to "tools × resources × spending limits", which is what a
 * voice add-on needs. See docs/06_SECURITY_MODEL.md.
 *
 * Invariant carried over unchanged: a schema communicates authority, it never
 * confers it. Nothing in the tool list is a boundary; `authorize` is.
 */

export type MandateStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface SpendLimits {
  /** ISO 4217, e.g. "USD". Amounts are integers in minor units (cents). */
  currency: string;
  /** Largest single call. */
  perCallMinor?: number;
  /** Largest cumulative spend over the mandate's life. */
  totalMinor?: number;
}

export interface Mandate {
  id: string;
  /** Bumped on every narrowing or widening. Calls must name the version they read. */
  version: number;
  status: MandateStatus;
  /** Tool names this mandate makes callable. Anything else is refused. */
  tools: string[];
  /** Resources the tools may touch (SKUs, rooms, lists). Empty means none. */
  resourceIds: string[];
  limits?: SpendLimits;
  /** Committed spend so far, in minor units. Staging does not count; commit does. */
  spentMinor: number;
  createdAt: number;
  expiresAt: number;
  endedAt?: number;
  endedReason?: 'REVOKED' | 'EXPIRED';
}

/** What an incoming tool call claims about itself. None of it is trusted. */
export interface MandateCall {
  tool: string;
  mandateVersion: number;
  resourceId?: string;
  amountMinor?: number;
}
