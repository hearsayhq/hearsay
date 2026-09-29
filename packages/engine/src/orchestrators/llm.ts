/**
 * llm orchestrator (FR-012): a real model plans from what was heard and the server's
 * live tool list. It stands in for the Alexa+ planner and says so. Tests whether the
 * tool SURFACE is understandable, with the mishearing in the words, not the arguments.
 */
import type { ModelContent, ModelProvider, Orchestrator, TurnContext } from '../orchestrator';

export const STAND_IN_SYSTEM = [
  'You are the planner of a voice assistant (a stand-in for Alexa+, not Alexa+ itself).',
  "The user's words come from speech recognition and may be misheard.",
  'Use the tools to do what the user asks. If you are unsure what they meant, ask one short question instead of guessing.',
  'Reply in one or two short spoken sentences: no markdown, no ids, no JSON, at most three options.',
  'You never answer confirmation questions on the user\'s behalf; the host asks the user.',
].join(' ');

export function llmOrchestrator(provider: ModelProvider, opts: { maxSteps?: number; maxTokens?: number } = {}): Orchestrator {
  const maxSteps = opts.maxSteps ?? 6;
  return {
    mode: 'llm',
    async respond(ctx: TurnContext) {
      const messages: Array<{ role: 'user' | 'assistant'; content: ModelContent[] }> = [];
      for (const t of ctx.history) {
        messages.push({ role: 'user', content: [{ type: 'text', text: t.heard }] });
        if (t.spoken) messages.push({ role: 'assistant', content: [{ type: 'text', text: t.spoken }] });
      }
      messages.push({ role: 'user', content: [{ type: 'text', text: ctx.heard }] });
      const tools = ctx.tools.map((t) => ({ name: t.name, description: t.description ?? '', inputSchema: t.inputSchema }));

      for (let step = 0; step < maxSteps; step++) {
        const started = performance.now();
        const res = await provider.converse({ system: STAND_IN_SYSTEM, messages, tools, maxTokens: opts.maxTokens ?? 1024 });
        ctx.recordPlan?.(res.durationMs ?? performance.now() - started, `${provider.id} #${step + 1}`);
        messages.push({ role: 'assistant', content: res.content });
        const uses = res.content.filter((c): c is Extract<ModelContent, { type: 'tool_use' }> => c.type === 'tool_use');
        if (res.stopReason !== 'tool_use' || !uses.length)
          return { spoken: res.content.flatMap((c) => (c.type === 'text' ? [c.text] : [])).join(' ').trim() };
        const results: ModelContent[] = [];
        for (const u of uses) {
          const r = await ctx.callTool(u.name, u.input);
          results.push({ type: 'tool_result', toolUseId: u.id, text: r.text, isError: r.isError });
        }
        messages.push({ role: 'user', content: results });
      }
      return { spoken: '' };
    },
  };
}
