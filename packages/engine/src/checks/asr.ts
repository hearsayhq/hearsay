/**
 * asr.robust (docs/05 §Did it hear me right?): compared with the clean run, a misheard
 * variant must have the same effect, ask back, or say what it heard. Silently doing
 * something else, or claiming success without an effect, is an error. The same reply to
 * different arguments ("Timer started." for fifteen and for fifty) counts as silent.
 */
import { parseNumber, spokenWords } from '../perturb/numbers';
import { fire, type TurnCheck } from './types';

const ASKS = /\?|\b(which|what|how many|how much|did you mean|say again|can you)\b/i;

function readsBack(spoken: string, heard: string): boolean {
  const s = spoken.toLowerCase();
  if (s.includes(heard.toLowerCase())) return true;
  const n = parseNumber(heard);
  return n !== undefined && new RegExp(`\\b${n}\\b`).test(s);
}

/**
 * The reply states every value the call passed that the clean call did not ("Pass timer set
 * for fifteen minutes." for label pass): a model, or a recorded mishearing, rarely misplaces
 * just the one word an edit names. With no clean call, every value counts.
 */
function statesChangedValues(spoken: string, args: Record<string, unknown>, clean: Record<string, unknown> | undefined): boolean {
  const values = Object.entries(args)
    .filter(([k, v]) => !clean || JSON.stringify(clean[k]) !== JSON.stringify(v))
    .flatMap(([, v]) => (typeof v === 'string' || typeof v === 'number' ? [spokenWords(String(v))] : []));
  const said = ` ${spokenWords(spoken)} `;
  return values.length > 0 && values.every((v) => v && said.includes(` ${v} `));
}

export const asrRobust: TurnCheck = {
  id: 'asr.robust',
  run({ trace, turns, clean, tools }) {
    if (trace.variant === 'clean' || !clean) return [];
    const heard = turns.at(-1)?.heard ?? '';
    const turnId = turns.at(-1)?.id;
    const spoken = turns.map((t) => t.spoken).join(' ');
    const cleanCalls = clean.turns.filter((t) => !t.setupOf).flatMap((t) => t.toolCalls);
    const calls = turns.flatMap((t) => t.toolCalls);
    const hint = 'Normalise what could be misheard (looseEnum() with synonyms), ask back when unsure, and read values back with speak().';

    if (!calls.length) return ASKS.test(spoken) ? [] : [fire('asr.robust', 0, `heard "${heard}": no tool was called and nothing was asked`, { turnId, evidence: { heard, spoken }, hint })];
    const named = [...new Set(calls.map((c) => c.tool))].map((t) => ((n) => (n > 1 ? `${t} ${n}×` : t))(calls.filter((c) => c.tool === t).length)).join(', ');
    if (!spoken.trim()) return [fire('asr.robust', 0, `heard "${heard}": called ${named}, then said nothing`, { turnId, evidence: { heard, calls: calls.map((c) => ({ tool: c.tool, args: c.args })) }, hint })];
    const expected = cleanCalls[0];
    // Only read something else ("Has the timer" lists the timers): nothing happened, and the
    // person heard the answer. Reading the same tool with other values still needs read-back.
    const readOnly = (name: string) => tools.find((t) => t.name === name)?.annotations?.readOnlyHint === true;
    if (calls.every((c) => readOnly(c.tool) && c.tool !== expected?.tool)) return [];
    const main = expected ? calls.find((c) => c.tool === expected.tool) : calls[0];
    if (!main) return [fire('asr.robust', 0, `heard "${heard}": called ${calls.map((c) => c.tool).join(', ')} instead of ${expected!.tool}`, { turnId, evidence: { heard, calls: calls.map((c) => c.tool) }, hint })];
    const before = expected?.result.text ?? '';

    // Same effect: the same reply for the same call, or for a call the server normalised to the
    // same structured result. The same reply to different arguments hides what was heard.
    const sameArgs = JSON.stringify(main.args) === JSON.stringify(expected?.args ?? main.args);
    const sameStructured = main.result.structuredContent !== undefined && JSON.stringify(main.result.structuredContent) === JSON.stringify(expected?.result.structuredContent);
    if (main.result.text === before && (sameArgs || sameStructured)) return [];
    if (main.result.isError && (main.result.errorCode || ASKS.test(main.result.text))) return []; // asked back or refused
    if ((trace.edits ?? []).some((e) => readsBack(spoken, e.to)) || statesChangedValues(spoken, main.args, expected?.args)) return []; // read back
    return [
      fire('asr.robust', 0, `heard "${heard}": ${main.tool} answered "${main.result.text.slice(0, 80)}" — a different result without saying what it heard`, {
        turnId,
        evidence: { heard, edits: trace.edits, args: main.args, cleanArgs: expected?.args, result: main.result.text.slice(0, 200), cleanResult: before.slice(0, 200) },
        hint,
      }),
    ];
  },
};
