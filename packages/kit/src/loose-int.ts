/**
 * A bounded whole number the model sees, validated loosely on the server: the numeric
 * counterpart of looseEnum. The input schema advertises `integer` with `minimum` and
 * `maximum` (lint.schema_constraints), but any value gets through to the handler, which
 * takes numbers and digit strings in range and refuses everything else with a spoken
 * question. A missing value reaches the handler too, so it can ask for it: a model that
 * heard "ate minutes" may leave the number out. A strict schema would answer "step forty"
 * or a missing number with "MCP error -32602", which the person would hear
 * (protocol.refusal_as_result).
 */
import { z } from 'zod';

export interface LooseInt {
  schema: z.ZodType;
  /** The whole number in range, or undefined. */
  parse(raw: unknown): number | undefined;
}

export function looseInt(min: number, max: number, description?: string): LooseInt {
  const base = z.any().optional().meta({ type: 'integer', minimum: min, maximum: max });
  return {
    schema: description ? base.describe(description) : base,
    parse(raw) {
      const n = typeof raw === 'number' ? raw : typeof raw === 'string' && /^\s*\d+\s*$/.test(raw) ? Number(raw) : NaN;
      return Number.isInteger(n) && n >= min && n <= max ? n : undefined;
    },
  };
}
