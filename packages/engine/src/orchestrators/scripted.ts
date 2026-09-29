/**
 * Scripted orchestrator (FR-011, D-002): the suite names the call, no model is
 * involved. The spoken reply is the tool result text, so every speak check judges
 * the server directly. `injectedCall` plays a compromised model (mandate.injection).
 */
import type { Orchestrator, TurnContext } from '../orchestrator';
import type { SuiteCase } from '../suite';

export function scriptedOrchestrator(c: SuiteCase): Orchestrator {
  const call = c.call ?? (c.expect.tool ? { tool: c.expect.tool, args: c.expect.args ?? {} } : undefined);
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
