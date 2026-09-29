/** speak.length and speak.no_structured_dump (docs/05 §Can I listen to this?). */
import { fire, limit, type TurnCheck } from './types';

const SPEAK_HINT = 'Build the reply with speak() from @hearsayhq/kit; put data for programs in structuredContent, not in the text.';

export const speakLength: TurnCheck = {
  id: 'speak.length',
  run({ suite, turns }) {
    const hard = limit('speak.length', 0, suite);
    const soft = limit('speak.length', 1, suite);
    return turns.flatMap((t) => {
      const n = t.spoken.length;
      if (n > hard) return [fire('speak.length', 0, `spoken reply is ${n} characters (over ${hard}, about 30 seconds)`, { turnId: t.id, evidence: { chars: n }, hint: SPEAK_HINT })];
      if (n > soft) return [fire('speak.length', 1, `spoken reply is ${n} characters (budget ${soft})`, { turnId: t.id, evidence: { chars: n }, hint: 'Say the one thing the person asked for; offer more instead of reading it all.' })];
      return [];
    });
  },
};

const PATTERNS: Array<[string, RegExp]> = [
  ['JSON or brackets', /[{}[\]]/],
  ['a markdown table or heading', /^\s*#{1,6}\s|\|\s*-{3,}|^\s*\|.*\|\s*$/m],
  ['a URL', /https?:\/\/|www\./i],
  ['a UUID', /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i],
  // sku-milk; ids with a digit after a short or known prefix (c-123, ord_8f2a); snake_case identifiers.
  ['an internal id', /\bsku-[a-z0-9-]+\b|\b(?:id|uid|usr|user|ord|order|cust|acct|txn|dev|device|room)[-_][a-z0-9-]*\d[a-z0-9-]*\b|\b[a-z]{1,3}-[a-z0-9]*\d[a-z0-9]*\b|\b[a-z]+_[a-z0-9_]+\b/i],
];

const wordsOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);

/** The first run of `n` consecutive words of `source` that also appears in `text`. */
function sharedRun(text: string, source: string, n: number): string | undefined {
  const t = ` ${wordsOf(text).join(' ')} `;
  const w = wordsOf(source);
  for (let i = 0; i + n <= w.length; i++) {
    const run = w.slice(i, i + n).join(' ');
    if (t.includes(` ${run} `)) return run;
  }
  return undefined;
}

export const speakNoStructuredDump: TurnCheck = {
  id: 'speak.no_structured_dump',
  run({ turns, tools }) {
    return turns.flatMap((t) => {
      const text = t.spoken;
      if (!text) return [];
      const out = [];
      const pattern = PATTERNS.find(([, re]) => re.test(text));
      const toolName = tools.map((x) => x.name).find((name) => new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(text));
      if (pattern || toolName) {
        const what = toolName ? `the tool name ${toolName}` : pattern![0];
        out.push(fire('speak.no_structured_dump', 0, `spoken reply contains ${what} (${text.length} chars)`, { turnId: t.id, evidence: { spoken: text.slice(0, 200), matched: what }, hint: SPEAK_HINT }));
      }
      for (const tool of tools) {
        const run = tool.description ? sharedRun(text, tool.description, 8) : undefined;
        if (run) {
          out.push(fire('speak.no_structured_dump', 1, `spoken reply repeats the description of ${tool.name}`, { turnId: t.id, evidence: { run }, hint: 'Descriptions are for the model, not the person; reply in your own short sentence.' }));
          break;
        }
      }
      return out;
    });
  },
};
