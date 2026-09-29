/**
 * The verbal tier (docs/05 §Verbal confirmation), for hosts without elicitation.
 * The requesting tool commits nothing: it speaks the question and hands the model a
 * token bound to the exact items and amount, single-use, at most 60 s. A separate
 * confirm tool redeems it. Weaker than elicitation — a model can hallucinate a yes —
 * so consent.path grades it warn. Fixes: consent.verbal_token.
 */
import { randomUUID } from 'node:crypto';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { speak } from './speak';

export const MAX_TOKEN_SECONDS = 60;

type Binding = Record<string, unknown>;
interface Pending {
  principal: string;
  action: string;
  binding: string;
  expiresAt: number;
  used: boolean;
}

const stable = (v: unknown): string =>
  Array.isArray(v) ? `[${v.map(stable).join(',')}]` : v && typeof v === 'object' ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable((v as Binding)[k])}`).join(',')}}` : JSON.stringify(v);

export type Redeemed = { ok: true; action: string } | { ok: false; reason: 'unknown' | 'expired' | 'used' | 'mismatch' };

export class VerbalTokens {
  private pending = new Map<string, Pending>();
  readonly ttlSeconds: number;

  constructor(private opts: { ttlSeconds?: number; now?: () => number } = {}) {
    this.ttlSeconds = opts.ttlSeconds ?? MAX_TOKEN_SECONDS;
    if (this.ttlSeconds > MAX_TOKEN_SECONDS) throw new RangeError(`verbal tokens live at most ${MAX_TOKEN_SECONDS} s`);
  }

  private now() {
    return this.opts.now?.() ?? Date.now();
  }

  /** Bind a token to what the person will be asked about. */
  issue(principal: string, action: string, binding: Binding): { token: string; expiresInSeconds: number } {
    const token = randomUUID();
    this.pending.set(token, { principal, action, binding: stable(binding), expiresAt: this.now() + this.ttlSeconds * 1000, used: false });
    return { token, expiresInSeconds: this.ttlSeconds };
  }

  /** Redeem once, for the same principal and the same binding, before it expires. */
  redeem(principal: string, token: string, binding: Binding): Redeemed {
    const p = this.pending.get(token);
    if (!p || p.principal !== principal) return { ok: false, reason: 'unknown' };
    if (p.used) return { ok: false, reason: 'used' };
    if (this.now() >= p.expiresAt) return { ok: false, reason: 'expired' };
    if (p.binding !== stable(binding)) return { ok: false, reason: 'mismatch' };
    p.used = true;
    return { ok: true, action: p.action };
  }

  /** Any change to what was asked about (the cart) voids the person's pending yes. */
  invalidate(principal: string): void {
    for (const [k, p] of this.pending) if (p.principal === principal) this.pending.delete(k);
  }
}

/** The requesting tool's result on the verbal tier: the question as speech, the token for the model. */
export function askVerbally(question: string, issued: { token: string; expiresInSeconds: number }, confirmTool: string): CallToolResult {
  return speak(question, { confirmation: { ...issued, question, confirmTool } });
}
