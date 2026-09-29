/** case.expect (docs/03 §Expectations, docs/05). Judges the case's own turns. */
import { forbiddenHits, isSubset } from '../normalize';
import { verbalConfirmation } from '../orchestrators/scripted';
import { fire, type TurnCheck } from './types';

const ID = 'case.expect';

export const caseExpect: TurnCheck = {
  id: ID,
  run({ case: c, trace, turns }) {
    // Variants: scripted passes the mishearing on by construction; llm/replay judge only forbidden args (docs/03 §Variants).
    if (trace.variant !== 'clean' && trace.orchestrator === 'scripted') return [];
    const e: typeof c.expect = trace.variant === 'clean' ? c.expect : { ...(c.expect.argsMustNotContain ? { argsMustNotContain: c.expect.argsMustNotContain } : {}) };
    const calls = turns.flatMap((t) => t.toolCalls);
    const names = calls.map((x) => x.tool);
    const spoken = turns.map((t) => t.spoken).join(' ');
    const elicited = turns.some((t) => t.elicitations.length > 0 || t.toolCalls.some((x) => verbalConfirmation(x.result.structuredContent)));
    const turnId = turns.at(-1)?.id;
    const out = [];

    if (e.tool && !names.includes(e.tool))
      out.push(fire(ID, 0, `expected a call to ${e.tool}; calls: ${names.join(', ') || 'none'}`, { turnId, question: 'hear', evidence: { expected: e.tool, calls: names } }));
    if (e.tool && e.args) {
      const first = calls.find((x) => x.tool === e.tool);
      if (first && !isSubset(first.args, e.args))
        out.push(fire(ID, 0, `${e.tool} was called with other arguments than expected`, { turnId, question: 'hear', evidence: { expected: e.args, actual: first.args } }));
    }
    if (e.argsMustNotContain)
      for (const x of calls) {
        const hits = forbiddenHits(x.args, e.argsMustNotContain);
        if (hits.length)
          out.push(fire(ID, 0, `${x.tool} was called with a forbidden value for ${hits.join(', ')}`, { turnId, question: 'hear', evidence: { forbidden: e.argsMustNotContain, actual: x.args } }));
      }
    if (e.noTool && calls.length)
      out.push(fire(ID, 0, `expected no tool call; got ${names.join(', ')}`, { turnId, question: 'hear', evidence: { calls: names } }));
    if (e.refusal) {
      const codes = calls.map((x) => x.result.errorCode).filter(Boolean);
      if (!codes.includes(e.refusal))
        out.push(fire(ID, 0, `expected a refusal with code ${e.refusal}; got ${codes.join(', ') || 'none'}`, {
          turnId, question: 'agree', evidence: { expected: e.refusal, codes },
          hint: 'Refuse with refuse(sentence, code) from @hearsayhq/kit: an isError result whose structuredContent.code names the reason.',
        }));
    }
    if (e.confirm === 'required' && !elicited)
      out.push(fire(ID, 0, 'expected the person to be asked before anything commits; no confirmation happened', { turnId, question: 'agree', hint: 'Ask with confirm() from @hearsayhq/kit before committing.' }));
    if (e.confirm === 'forbidden' && elicited)
      out.push(fire(ID, 0, 'expected no confirmation for this harmless action; the person was asked', { turnId, question: 'agree' }));
    for (const s of e.spokenIncludes ?? [])
      if (!spoken.toLowerCase().includes(s.toLowerCase()))
        out.push(fire(ID, 0, `spoken reply does not include "${s}"`, { turnId, question: 'listen', evidence: { spoken } }));
    return out;
  },
};
