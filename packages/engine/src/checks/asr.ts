/**
 * asr.robust (docs/05 §Did it hear me right?): compared with the clean run, a misheard
 * variant must have the same effect, ask back, or say what it heard. Silently doing
 * something else, or claiming success without an effect, is an error.
 */
import { parseNumber } from '../perturb/numbers';
import { fire, type TurnCheck } from './types';

const ASKS = /\?|\b(which|what|how many|how much|did you mean|say again|can you)\b/i;

function readsBack(spoken: string, heard: string): boolean {
  const s = spoken.toLowerCase();
  if (s.includes(heard.toLowerCase())) return true;
  const n = parseNumber(heard);
  return n !== undefined && new RegExp(`\\b${n}\\b`).test(s);
}

export const asrRobust: TurnCheck = {
  id: 'asr.robust',
  run({ trace, turns, clean }) {
    if (trace.variant === 'clean' || !clean) return [];
    const heard = turns.at(-1)?.heard ?? '';
    const turnId = turns.at(-1)?.id;
    const spoken = turns.map((t) => t.spoken).join(' ');
    const cleanCalls = clean.turns.filter((t) => !t.setupOf).flatMap((t) => t.toolCalls);
    const calls = turns.flatMap((t) => t.toolCalls);
    const hint = 'Normalise what could be misheard (looseEnum() with synonyms), ask back when unsure, and read values back with speak().';

    if (!calls.length) return ASKS.test(spoken) ? [] : [fire('asr.robust', 0, `heard "${heard}": no tool was called and nothing was asked`, { turnId, evidence: { heard, spoken }, hint })];
    const expected = cleanCalls[0];
    const main = expected ? calls.find((c) => c.tool === expected.tool) : calls[0];
    if (!main) return [fire('asr.robust', 0, `heard "${heard}": called ${calls.map((c) => c.tool).join(', ')} instead of ${expected!.tool}`, { turnId, evidence: { heard, calls: calls.map((c) => c.tool) }, hint })];
    const before = expected?.result.text ?? '';

    if (main.result.text === before) return []; // same effect
    if (main.result.isError && (main.result.errorCode || ASKS.test(main.result.text))) return []; // asked back or refused
    if ((trace.edits ?? []).some((e) => readsBack(spoken, e.to))) return []; // read back
    return [
      fire('asr.robust', 0, `heard "${heard}": ${main.tool} answered "${main.result.text.slice(0, 80)}" — a different result without saying what it heard`, {
        turnId,
        evidence: { heard, edits: trace.edits, args: main.args, cleanArgs: expected?.args, result: main.result.text.slice(0, 200), cleanResult: before.slice(0, 200) },
        hint,
      }),
    ];
  },
};
