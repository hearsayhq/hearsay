/**
 * An enum the model sees, validated loosely on the server (docs/06 §Tool surface).
 * The input schema advertises `enum`, but any string gets through to the handler,
 * which normalises it (synonyms, spacing: "livingroom" → living_room) or refuses
 * with a spoken question. A strict schema enum would answer first with
 * "MCP error -32602", which the person would hear (protocol.refusal_as_result).
 */
import { z } from 'zod';

export interface LooseEnum<T extends string> {
  schema: z.ZodString;
  /** The canonical value, or undefined if nothing matches. */
  normalize(raw: string): T | undefined;
}

const squash = (s: string) => s.toLowerCase().replace(/[\s_-]+/g, '');

export function looseEnum<T extends string>(values: readonly T[], synonyms: Partial<Record<T, string[]>> = {}, description?: string): LooseEnum<T> {
  const table = new Map<string, T>();
  for (const v of values) {
    table.set(squash(v), v);
    for (const s of synonyms[v] ?? []) table.set(squash(s), v);
  }
  const base = z.string().meta({ enum: [...values] });
  return {
    schema: description ? base.describe(description) : base,
    normalize: (raw) => table.get(squash(raw)),
  };
}
