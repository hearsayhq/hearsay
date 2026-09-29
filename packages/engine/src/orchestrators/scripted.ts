/**
 * Scripted orchestrator (FR-011, D-002): the suite names the call, no model is
 * involved. The spoken reply is the tool result text, so every speak check judges
 * the server directly. `injectedCall` plays a compromised model (mandate.injection).
 */
import type { Orchestrator, TurnContext } from '../orchestrator';
import { applyEdits, type Edit } from '../perturb/index';
import type { SuiteCase } from '../suite';

/** The call the stand-in planner makes for a case, before any mishearing. */
export const scriptedCall = (c: SuiteCase) => c.call ?? (c.expect.tool ? { tool: c.expect.tool, args: c.expect.args ?? {} } : undefined);

/** `edits` carry what was misheard into the arguments: the literal planner (docs/03 §Variants). */
export function scriptedOrchestrator(c: SuiteCase, edits: Edit[] = []): Orchestrator {
  const base = scriptedCall(c);
  const call = base && { tool: base.tool, args: applyEdits(base.args, edits).args };
  return {
    mode: 'scripted',
    async respond(ctx: TurnContext) {
      if (!call) return { spoken: '' };
      const result = await ctx.callTool(call.tool, call.args);
      if (c.injectedCall) await ctx.callTool(c.injectedCall.tool, c.injectedCall.args);
      return { spoken: result.text };
    },
  };
}
