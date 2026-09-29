/** lint.error_actionable and protocol.refusal_as_result (docs/05 §Can I listen to this?). */
import { fire, type TurnCheck } from './types';

const REFUSE_HINT = 'Refuse with refuse(sentence, code) from @hearsayhq/kit: one spoken sentence, the code in structuredContent.';
const TECHNICAL: Array<[string, RegExp]> = [
  ['a stack trace', /\n\s+at\s|\bat\s+\S+\s+\(?\S+:\d+:\d+\)?/],
  ['an error code', /\b(?:E[A-Z]{3,}|ERR_[A-Z_]+|HTTP\s?\d{3}|-32\d{3}|[A-Z]{2,}_[A-Z_]{2,}|[A-Za-z]*Error:)/],
  ['an internal id', /\bsku-[a-z0-9-]+\b|\b[a-z]{1,3}-[a-z0-9]*\d[a-z0-9]*\b|\b[a-z]+_[a-z0-9_]+\b|\b[0-9a-f]{8}-[0-9a-f]{4}-/i],
];
const ACTIONABLE = /\b(can|could|try|say|allowed|which|want|would you|please|ask|instead|should i)\b/i;

export const lintErrorActionable: TurnCheck = {
  id: 'lint.error_actionable',
  run({ turns }) {
    return turns.flatMap((t) =>
      t.toolCalls
        .filter((c) => c.result.isError && !c.result.protocolError)
        .flatMap((c) => {
          const text = c.result.text;
          const tech = TECHNICAL.find(([, re]) => re.test(text));
          if (tech) return [fire('lint.error_actionable', 0, `${c.tool} error contains ${tech[0]}`, { turnId: t.id, evidence: { tool: c.tool, text: text.slice(0, 200) }, hint: REFUSE_HINT })];
          if (text.length > 200 || !ACTIONABLE.test(text))
            return [fire('lint.error_actionable', 1, `${c.tool} error ${text.length > 200 ? `is ${text.length} characters` : 'names no next step'}`, { turnId: t.id, evidence: { tool: c.tool, text: text.slice(0, 200) }, hint: REFUSE_HINT })];
          return [];
        }),
    );
  },
};

export const protocolRefusalAsResult: TurnCheck = {
  id: 'protocol.refusal_as_result',
  run({ turns }) {
    return turns.flatMap((t) =>
      t.toolCalls.flatMap((c) => {
        if (c.result.protocolError)
          return [fire('protocol.refusal_as_result', 0, `${c.tool} was answered with JSON-RPC error ${c.result.protocolError.code}, not a tool result`, { turnId: t.id, evidence: { tool: c.tool, ...c.result.protocolError }, hint: REFUSE_HINT })];
        if (c.result.isError && /^MCP error -32602/.test(c.result.text))
          return [fire('protocol.refusal_as_result', 0, `${c.tool}: the SDK's input validation error would be read to the person`, { turnId: t.id, evidence: { tool: c.tool, text: c.result.text.slice(0, 200) }, hint: 'Validate loosely and refuse in words: looseEnum() and refuse() from @hearsayhq/kit.' })];
        return [];
      }),
    );
  },
};
