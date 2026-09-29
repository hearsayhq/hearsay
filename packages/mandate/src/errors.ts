/**
 * Refusal codes keep the WebMCP ordering and meaning. `spoken` is new: behind a
 * voice assistant the refusal is read aloud, so every error carries one short
 * sentence a person can act on (checked by lint.error_actionable, docs/05).
 */
export type MandateErrorCode =
  | 'NO_ACTIVE_MANDATE'
  | 'MANDATE_EXPIRED'
  | 'POLICY_CHANGED'
  | 'OUT_OF_SCOPE'
  | 'LIMIT_EXCEEDED';

export class MandateError extends Error {
  constructor(
    readonly code: MandateErrorCode,
    message: string,
    /** One speakable sentence: what happened and what the person can do. */
    readonly spoken: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'MandateError';
  }
}
