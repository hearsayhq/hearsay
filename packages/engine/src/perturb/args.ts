/**
 * The literal planner (docs/03 §Variants): what was heard becomes argument values.
 * "fifteen" → "fifty" turns amountUsd 15 into 50; "living room" → "livingroom" turns
 * living_room into livingroom; a number heard as a word ("two" → "to") drops the argument.
 */
import { parseNumber } from './numbers';
import type { Edit } from './types';

const squash = (s: string) => s.toLowerCase().replace(/[\s_-]+/g, '');

function mapValue(v: unknown, e: Edit): { value: unknown; drop?: boolean; changed: boolean } {
  const nFrom = parseNumber(e.from);
  if (nFrom !== undefined && (typeof v === 'number' || (typeof v === 'string' && parseNumber(v) !== undefined))) {
    const current = typeof v === 'number' ? v : parseNumber(v as string);
    if (current !== nFrom) return { value: v, changed: false };
    const nTo = parseNumber(e.to);
    return nTo === undefined ? { value: undefined, drop: true, changed: true } : { value: typeof v === 'number' ? nTo : String(nTo), changed: true };
  }
  if (typeof v === 'string' && squash(v) === squash(e.from) && v !== e.to) return { value: e.to, changed: true };
  return { value: v, changed: false };
}

export function applyEdits(args: Record<string, unknown>, edits: Edit[]): { args: Record<string, unknown>; changed: boolean } {
  let changed = false;
  const out: Record<string, unknown> = { ...args };
  for (const e of edits)
    for (const [k, v] of Object.entries(out)) {
      const r = mapValue(v, e);
      if (!r.changed) continue;
      changed = true;
      if (r.drop) delete out[k];
      else out[k] = r.value;
    }
  return { args: out, changed };
}
