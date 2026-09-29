/**
 * Variants of a case (FR-015): seeded, deterministic, 0–3 per perturbation, none when a
 * rule does not apply. In scripted mode only variants that change the call's arguments
 * are kept, since the literal planner can only pass on what reaches its arguments.
 */
import { applyEdits } from './args';
import { pick, prng, seedFor } from './prng';
import { RULES } from './rules';
import { CLEAN, type Variant } from './types';

export { applyEdits } from './args';
export { CLEAN, type Variant, type Edit } from './types';

export interface VariantOptions {
  seed: number;
  mode: 'scripted' | 'llm' | 'replay';
  /** The scripted call's arguments; variants that leave them unchanged are dropped in scripted mode. */
  args?: Record<string, unknown>;
  /** Recorded mishearings for asr.roundtrip, from `hearsay gen-variants`. */
  recorded?: Array<{ heard: string }>;
}

const MAX_PER_PERTURBATION = 3;

export function variantsFor(caseId: string, utterance: string, perturbations: string[], opts: VariantOptions): Variant[] {
  const out: Variant[] = [CLEAN(utterance)];
  for (const p of perturbations) {
    let candidates = p === 'asr.roundtrip' ? (opts.recorded ?? []).map((r) => ({ heard: r.heard, edits: wordEdits(utterance, r.heard) })) : (RULES[p]?.(utterance) ?? []);
    if (p === 'asr.self_correction' && opts.mode === 'scripted') candidates = [];
    if (opts.mode === 'scripted') candidates = candidates.filter((c) => opts.args && applyEdits(opts.args, c.edits).changed);
    const chosen = pick(candidates, MAX_PER_PERTURBATION, prng(seedFor(opts.seed, caseId, p)));
    chosen.forEach((c, i) => out.push({ id: `${p}#${i + 1}`, perturbation: p, heard: c.heard, edits: c.edits }));
  }
  return out;
}

/** Word-level edits between what was said and what was heard (for recorded variants). */
export function wordEdits(said: string, heard: string): Array<{ from: string; to: string }> {
  const a = said.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);
  const b = heard.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) dp[i]![j] = a[i] === b[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
  const edits: Array<{ from: string; to: string }> = [];
  let i = 0;
  let j = 0;
  let from: string[] = [];
  let to: string[] = [];
  const flush = () => {
    if (from.length || to.length) edits.push({ from: from.join(' '), to: to.join(' ') });
    from = [];
    to = [];
  };
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      flush();
      i++;
      j++;
    } else if (j < b.length && (i >= a.length || dp[i]![j + 1]! >= dp[i + 1]![j]!)) to.push(b[j++]!);
    else from.push(a[i++]!);
  }
  flush();
  return edits.filter((e) => e.from && e.to);
}
