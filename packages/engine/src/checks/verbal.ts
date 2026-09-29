/**
 * consent.verbal_token (docs/05 §Verbal confirmation): an active probe on a case that uses
 * the verbal tier. The token must be single-use, short-lived, bound to the person and to
 * what they were asked about.
 */
import { verbalConfirmation } from '../orchestrators/scripted';
import type { Finding } from '../report';
import { scriptedCall } from '../orchestrators/scripted';
import { setupChain } from '../runner';
import { fire, type ServerCheck } from './types';

const HINT = 'Use VerbalTokens from @hearsayhq/kit: bound to items and amount, 60 s at most, single use, voided by any cart change.';

export const consentVerbalToken: ServerCheck = {
  id: 'consent.verbal_token',
  async run({ suite, playForProbe, newPrincipal, url }) {
    if (!suite || !playForProbe) return [];
    const c = suite.cases.find((x) => !x.client.elicitation && x.expect.confirm === 'required' && setupChain(suite, x).length);
    if (!c) return [];
    const out: Finding[] = [];
    const tokenOf = (turns: Awaited<ReturnType<typeof playForProbe>>['turns']) => turns.at(-1)?.toolCalls.map((x) => verbalConfirmation(x.result.structuredContent)).find(Boolean);
    const bad = (why: string, evidence: Record<string, unknown> = {}) => out.push(fire('consent.verbal_token', 0, `${c.id}: ${why}`, { evidence, hint: HINT }));

    // Single use, and declared lifetime.
    let run = await playForProbe(c, { answer: 'decline' });
    try {
      const v = tokenOf(run.turns);
      if (!v) return [];
      if (v.expiresInSeconds > 60) bad(`the token lives ${v.expiresInSeconds} s`, { expiresInSeconds: v.expiresInSeconds });
      const first = await run.session.callTool(v.confirmTool, { token: v.token });
      const again = await run.session.callTool(v.confirmTool, { token: v.token });
      if (!first.result.isError && !again.result.isError) bad('the same yes was accepted twice');
      if (v.expiresInSeconds <= 5) {
        const late = await playForProbe(c, { answer: 'decline' });
        try {
          const lv = tokenOf(late.turns)!;
          await new Promise((r) => setTimeout(r, lv.expiresInSeconds * 1000 + 500));
          if (!(await late.session.callTool(lv.confirmTool, { token: lv.token })).result.isError) bad(`the token still worked after ${lv.expiresInSeconds} s`);
        } finally {
          await late.session.close();
        }
      }
    } finally {
      await run.session.close();
    }

    // Voided by a change to what was asked about: repeat the last setup step, then say yes.
    run = await playForProbe(c, { answer: 'decline' });
    try {
      const v = tokenOf(run.turns);
      const setup = setupChain(suite, c).at(-1);
      const repeat = setup && scriptedCall(setup);
      if (v && repeat) {
        await run.session.callTool(repeat.tool, repeat.args);
        if (!(await run.session.callTool(v.confirmTool, { token: v.token })).result.isError) bad(`the yes survived a change (${repeat.tool} again) after the question`);
      }
    } finally {
      await run.session.close();
    }

    // Bound to the person: someone else cannot use it.
    run = await playForProbe(c, { answer: 'decline' });
    try {
      const v = tokenOf(run.turns);
      if (v) {
        const { McpSession } = await import('../session');
        const other = await McpSession.open({ url, principal: newPrincipal(), elicitation: false });
        try {
          if (!(await other.callTool(v.confirmTool, { token: v.token })).result.isError) bad('another person could use the token');
        } finally {
          await other.close();
        }
      }
    } finally {
      await run.session.close();
    }
    return out;
  },
};
