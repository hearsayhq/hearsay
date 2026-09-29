/**
 * The curated perturbations (docs/05 §Perturbations). Each rule lists every place an
 * utterance could be misheard; the seeded picker keeps up to three.
 */
import { TEEN_TENS } from './numbers';
import type { Edit } from './types';

export interface Candidate {
  heard: string;
  edits: Edit[];
}

type Rule = (utterance: string) => Candidate[];

const wordRe = (w: string) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');

/** Replace one occurrence (the `index`-th) of `from` with `to`. */
function replaceAt(s: string, from: string, to: string, index: number): string {
  let i = -1;
  return s.replace(wordRe(from), (m) => (++i === index ? (m[0] === m[0]!.toUpperCase() ? to[0]!.toUpperCase() + to.slice(1) : to) : m));
}

function swaps(pairs: Array<[string, string]>): Rule {
  return (u) =>
    pairs.flatMap(([from, to]) => {
      const n = (u.match(wordRe(from)) ?? []).length;
      return Array.from({ length: n }, (_, i) => ({ heard: replaceAt(u, from, to, i), edits: [{ from, to }] }));
    });
}

const both = (pairs: Array<[string, string]>): Array<[string, string]> => pairs.flatMap(([a, b]) => [[a, b], [b, a]] as Array<[string, string]>);

const DIGIT_PAIRS: Array<[string, string]> = [3, 4, 5, 6, 7, 8, 9].map((d) => [String(10 + d), String(d * 10)]);

export const RULES: Record<string, Rule> = {
  'asr.number_confusion': swaps([...both(TEEN_TENS), ...both(DIGIT_PAIRS)]),
  'asr.homophones': swaps([
    ['for', 'four'], ['four', 'for'], ['two', 'to'], ['to', 'two'], ['too', 'two'],
    ['eight', 'ate'], ['ate', 'eight'], ['right', 'write'], ['write', 'right'], ['won', 'one'], ['one', 'won'],
  ]),
  'asr.compound_split': swaps(both([['living room', 'livingroom'], ['bedroom', 'bed room'], ['bathroom', 'bath room'], ['whole house', 'wholehouse']])),
  'asr.self_correction': (u) => {
    // "add two cartons" → "add three, no, two cartons": a wrong value first, then the intended one.
    const m = u.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\b/i);
    if (!m) return [];
    const wrong = { one: 'two', two: 'three', three: 'four', four: 'five', five: 'six', six: 'seven', seven: 'eight', eight: 'nine', nine: 'ten', ten: 'eleven' }[m[1]!.toLowerCase()] ?? String(Number(m[1]) + 1);
    return [{ heard: u.replace(m[0], `${wrong}, no, ${m[0]}`), edits: [] }];
  },
};
