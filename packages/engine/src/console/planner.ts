/**
 * The console's planner without a model (D-023): pick the suite case whose utterance is
 * closest to what was typed, and carry the word differences into its arguments with the
 * literal planner ("twenty minutes" for "fifteen minutes" → minutes: 20). It says what it
 * matched, so nobody mistakes it for a language model.
 */
import type { Orchestrator, TurnContext } from '../orchestrator';
import { scriptedCall, scriptedOrchestrator } from '../orchestrators/scripted';
import { wordEdits } from '../perturb/index';
import type { Suite, SuiteCase } from '../suite';

const words = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean));

export function similarity(a: string, b: string): number {
  const x = words(a);
  const y = words(b);
  const inter = [...x].filter((w) => y.has(w)).length;
  return inter / Math.max(1, new Set([...x, ...y]).size);
}

export interface Match {
  case: SuiteCase;
  score: number;
}

export function nearestCase(suite: Suite, heard: string): Match | undefined {
  let best: Match | undefined;
  for (const c of suite.cases) {
    if (!scriptedCall(c)) continue;
    const said = Array.isArray(c.say) ? c.say.at(-1)! : c.say;
    const score = similarity(said, heard);
    if (!best || score > best.score) best = { case: c, score };
  }
  return best && best.score >= 0.3 ? best : undefined;
}

export function nearestCasePlanner(suite: Suite, onMatch?: (m: Match | undefined) => void): Orchestrator {
  return {
    mode: 'scripted',
    async respond(ctx: TurnContext) {
      const m = nearestCase(suite, ctx.heard);
      onMatch?.(m);
      if (!m) {
        const examples = suite.cases.slice(0, 3).map((c) => `"${Array.isArray(c.say) ? c.say[0] : c.say}"`).join(', ');
        return { spoken: `I don't know how to do that yet. Try something like ${examples}.` };
      }
      const said = Array.isArray(m.case.say) ? m.case.say.at(-1)! : m.case.say;
      // The typed words replace the case's words, as a literal planner would pass them on.
      const edits = wordEdits(said, ctx.heard);
      return scriptedOrchestrator({ ...m.case, human: { ...m.case.human, answer: 'accept' } }, edits).respond(ctx);
    },
  };
}
