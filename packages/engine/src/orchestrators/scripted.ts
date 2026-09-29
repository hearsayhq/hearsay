/**
 * Scripted orchestrator (FR-011, D-002): the suite names the call, no model is
 * involved. The spoken reply is the tool result text, so every speak check judges
 * the server directly. `injectedCall` plays a compromised model (mandate.injection).
 */
import type { Orchestrator, TurnContext } from '../orchestrator';
import { applyEdits, type Edit } from '../perturb/index';
import { parseNumber } from '../perturb/numbers';
import { mentions } from '../session';
import type { SuiteCase } from '../suite';

/** The call the stand-in planner makes for a case, before any mishearing. */
export const scriptedCall = (c: SuiteCase) => c.call ?? (c.expect.tool ? { tool: c.expect.tool, args: c.expect.args ?? {} } : undefined);

/** `edits` carry what was misheard into the arguments: the literal planner (docs/03 §Variants). */
export function scriptedOrchestrator(c: SuiteCase, edits: Edit[] = []): Orchestrator {
  const base = scriptedCall(c);
  const call = base && { tool: base.tool, args: applyEdits(base.args, edits).args };
  // The person knows the amount they meant and says no to a question that states a misheard one.
  const misheard = misheardNumbers(edits);
  return {
    mode: 'scripted',
    async respond(ctx: TurnContext) {
      if (!call) return { spoken: '' };
      let result = await ctx.callTool(call.tool, call.args);
      // Verbal tier (FR-005, docs/05 §Verbal confirmation): the person answers the spoken question.
      const pending = verbalConfirmation(result.structuredContent);
      if (pending && c.human.answer === 'accept' && !mentions(pending.question, misheard)) result = await ctx.callTool(pending.confirmTool, { token: pending.token });
      if (c.injectedCall) await ctx.callTool(c.injectedCall.tool, c.injectedCall.args);
      return { spoken: result.text };
    },
  };
}

/** The verbal-confirmation convention, if a tool result carries one. */
export function verbalConfirmation(structured: unknown): { token: string; question: string; confirmTool: string; expiresInSeconds: number } | undefined {
  const c = (structured as { confirmation?: Record<string, unknown> } | undefined)?.confirmation;
  if (!c || typeof c.token !== 'string' || typeof c.confirmTool !== 'string') return undefined;
  return { token: c.token, question: String(c.question ?? ''), confirmTool: c.confirmTool, expiresInSeconds: Number(c.expiresInSeconds ?? 0) };
}

/** The misheard values of numeric edits, as words and digits ("fifty", "50"). */
export function misheardNumbers(edits: Edit[]): string[] {
  return edits.flatMap((e) => {
    const from = parseNumber(e.from);
    const to = parseNumber(e.to);
    return from !== undefined && to !== undefined ? [e.to, String(to)] : [];
  });
}
