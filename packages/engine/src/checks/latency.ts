/** latency.tool and latency.first_audio (docs/05 §Do I have to wait?). */
import { firstAudio } from '../latency';
import { fire, limit, type TurnCheck } from './types';

export const latencyTool: TurnCheck = {
  id: 'latency.tool',
  run({ suite, turns }) {
    const max = limit('latency.tool', 0, suite);
    return turns.flatMap((t) =>
      t.toolCalls
        .filter((c) => c.latencyMs > max)
        .map((c) =>
          fire('latency.tool', 0, `${c.tool} took ${Math.round(c.latencyMs)} ms (limit ${max} ms)`, {
            turnId: t.id,
            evidence: { tool: c.tool, latencyMs: Math.round(c.latencyMs), limitMs: max },
            hint: 'Answer from a cache or acknowledge first and finish in the background; keep upstream calls off the spoken path.',
          }),
        ),
    );
  },
};

export const latencyFirstAudio: TurnCheck = {
  id: 'latency.first_audio',
  run({ suite, trace, turns }) {
    const budget = limit('latency.first_audio', 0, suite);
    const lowerBound = trace.orchestrator === 'scripted';
    return turns.flatMap((t) => {
      const fa = firstAudio(t);
      if (fa.totalMs <= budget) return [];
      const r = (n: number) => Math.round(n);
      return [
        fire('latency.first_audio', 0, `first audio after ${r(fa.totalMs)} ms (budget ${budget} ms${lowerBound ? ', lower bound: planning counted as 0' : ''})`, {
          turnId: t.id,
          evidence: { totalMs: r(fa.totalMs), asrMs: r(fa.asrMs), planMs: r(fa.planMs), toolMs: r(fa.toolMs), speakMs: r(fa.speakMs), budgetMs: budget, lowerBound },
          hint: 'The tool share is the part the server controls; see latency.tool.',
        }),
      ];
    });
  },
};
