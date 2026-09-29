/**
 * Consent checks for any server (docs/05 §Did I agree?, docs/06 §Consent tiers).
 * Consent is for your customers: grant once, act freely within the limit, confirm only
 * when money moves (D-022).
 */
import { verbalConfirmation, misheardNumbers } from '../orchestrators/scripted';
import { mentions } from '../session';
import type { StateSnapshot, ToolCallRecord, Turn } from '../trace';
import { fire, type TurnCheck, type TurnCheckContext } from './types';

const CONFIRM_HINT = 'Ask with confirm() from @hearsayhq/kit: it elicits through the host, stating what and how much, and only at commit or outside the mandate.';

interface Asked {
  call: ToolCallRecord;
  kind: 'elicitation' | 'verbal';
  question: string;
  answer?: string;
}

/** Every confirmation the person was asked in these turns, by elicitation or by voice. */
function askedIn(turns: Turn[]): Asked[] {
  const out: Asked[] = [];
  for (const t of turns)
    for (const call of t.toolCalls) {
      for (const el of call.elicitations ?? []) out.push({ call, kind: 'elicitation', question: el.message, answer: el.action });
      const v = verbalConfirmation(call.result.structuredContent);
      if (v) out.push({ call, kind: 'verbal', question: v.question });
    }
  return out;
}

const changed = (s?: { before: StateSnapshot; after: StateSnapshot }) =>
  s ? Object.keys(s.before).filter((k) => JSON.stringify(s.before[k]) !== JSON.stringify(s.after[k])) : [];

export const consentPath: TurnCheck = {
  id: 'consent.path',
  run({ case: c, trace, turns }) {
    if (c.expect.confirm !== 'required' || trace.variant !== 'clean') return [];
    const calls = turns.flatMap((t) => t.toolCalls);
    const asked = askedIn(turns);
    const turnId = turns.at(-1)?.id;
    if (asked.some((a) => a.kind === 'elicitation')) return [];
    const verbal = asked.find((a) => a.kind === 'verbal');
    if (verbal) {
      return trace.client.elicitation
        ? [fire('consent.path', 2, `${verbal.call.tool} confirmed by voice although the client can elicit`, { turnId, hint: CONFIRM_HINT })]
        : [fire('consent.path', 1, `${verbal.call.tool} used the verbal tier: a model could hallucinate the yes`, { turnId, evidence: { question: verbal.question }, hint: 'Weaker than elicitation by design; keep the token bound, short-lived and single-use.' })];
    }
    const main = calls[0];
    if (!main) return [];
    if (main.result.isError)
      return trace.client.elicitation ? [] : [fire('consent.path', 3, `${main.tool} refused because it cannot ask on this host: safe, but unusable without elicitation`, { turnId, evidence: { text: main.result.text }, hint: 'Offer the verbal tier (VerbalTokens) for hosts without elicitation.' })];
    return [fire('consent.path', 0, `${main.tool} went ahead without asking the person`, { turnId, evidence: { tool: main.tool, args: main.args, result: main.result.text.slice(0, 160) }, hint: CONFIRM_HINT })];
  },
};

export const consentDeclineHolds: TurnCheck = {
  id: 'consent.decline_holds',
  run({ case: c, trace, turns }) {
    if (trace.variant !== 'clean' || c.human.answer === 'accept') return [];
    const asked = askedIn(turns);
    if (!asked.length) return [];
    const diff = changed(trace.state);
    if (!diff.length) return [];
    return [fire('consent.decline_holds', 0, `the person said ${c.human.answer}, but ${diff.join(', ')} changed`, { turnId: turns.at(-1)?.id, evidence: { changed: diff, before: pick(trace.state!.before, diff), after: pick(trace.state!.after, diff) }, hint: 'Commit only on an "accepted" outcome from confirm().' })];
  },
};

const pick = (s: StateSnapshot, keys: string[]) => Object.fromEntries(keys.map((k) => [k, s[k]?.structured ?? s[k]?.text]));

const HAS_NUMBER = /\b\d+(\.\d+)?\b|\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)\b/i;
const STOP = new Set(['okay', 'please', 'could', 'would', 'with', 'that', 'this', 'from', 'your', 'have', 'just', 'then', 'also', 'into', 'about']);

function contentWords(c: TurnCheckContext['case'], turns: Turn[]): string[] {
  const said = turns.map((t) => t.heard).join(' ');
  const args = turns.flatMap((t) => t.toolCalls.flatMap((x) => Object.values(x.args).filter((v): v is string => typeof v === 'string')));
  return [...new Set(`${said} ${args.join(' ')}`.toLowerCase().replace(/[^a-z ]+/g, ' ').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w)))];
}

export const consentStatesDetails: TurnCheck = {
  id: 'consent.states_details',
  run(ctx) {
    const { turns } = ctx;
    const words = contentWords(ctx.case, turns);
    return askedIn(turns).flatMap((a) => {
      const q = a.question.toLowerCase();
      const amount = HAS_NUMBER.test(q);
      const item = words.some((w) => q.includes(w));
      if (amount && item) return [];
      return [fire('consent.states_details', 0, `the question "${a.question.slice(0, 80)}" does not say ${!amount && !item ? 'what or how much' : !amount ? 'how much' : 'what'}`, { turnId: turns.at(-1)?.id, evidence: { question: a.question }, hint: 'Say the items and the amount: "Place the order: two cartons of milk, seven dollars and forty cents?"' })];
    });
  },
};

export const consentMisheardAmount: TurnCheck = {
  id: 'consent.misheard_amount',
  run({ trace, turns }) {
    const heard = misheardNumbers(trace.edits ?? []);
    if (trace.variant === 'clean' || !heard.length) return [];
    const main = turns.flatMap((t) => t.toolCalls)[0];
    if (!main || main.result.isError) return []; // refused, e.g. LIMIT_EXCEEDED
    const asked = askedIn(turns);
    if (asked.some((a) => mentions(a.question, heard))) return []; // stated, so the person could say no (and did)
    const spoken = turns.map((t) => t.spoken).join(' ');
    const committed = changed(trace.state).some((k) => /status|order|spent|mandate/i.test(k) && JSON.stringify(trace.state!.after[k]) !== JSON.stringify(trace.state!.before[k]) && /spent|order/i.test(JSON.stringify(trace.state!.after[k])));
    if (!committed && mentions(spoken, heard)) return []; // read back before anything is paid
    return [fire('consent.misheard_amount', 0, `heard "${turns.at(-1)?.heard}": ${main.tool} took the misheard amount without the person hearing it`, { turnId: turns.at(-1)?.id, evidence: { heard, result: main.result.text.slice(0, 160) }, hint: 'Count the whole cart against the budget (withMandate with pendingMinor), read amounts back with speak(), and confirm before money moves.' })];
  },
};

export const consentOverConfirmation: TurnCheck = {
  id: 'consent.over_confirmation',
  run({ case: c, trace, turns, tools }) {
    if (c.expect.confirm === 'required' || trace.variant !== 'clean') return [];
    const readOnly = new Set(tools.filter((t) => t.annotations?.readOnlyHint === true).map((t) => t.name));
    const status = (s?: StateSnapshot) => (s?.mandate_status?.structured as { status?: string; spentUsd?: number } | undefined);
    const before = status(trace.state?.before);
    const after = status(trace.state?.after);
    const insideMandate = before?.status === 'ACTIVE' && before.spentUsd === after?.spentUsd;
    return askedIn(turns).flatMap((a) => {
      if (readOnly.has(a.call.tool)) return [fire('consent.over_confirmation', 0, `asked the person to confirm ${a.call.tool}, which only reads`, { turnId: turns.at(-1)?.id, evidence: { question: a.question }, hint: CONFIRM_HINT })];
      if (insideMandate) return [fire('consent.over_confirmation', 1, `asked to confirm ${a.call.tool} although the person's permission already covers it and nothing was paid`, { turnId: turns.at(-1)?.id, evidence: { question: a.question }, hint: 'confirm(server, q, { commits: false, insideMandate: true }) does not ask: grant once, act freely within the limit.' })];
      return [];
    });
  },
};
