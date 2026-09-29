/**
 * The latency model (docs/03 §Latency model, D-004):
 * first_audio = asr + plan + Σ tool + speak_ttfb, elicitation time excluded.
 * asr and speak are modeled constants; tool is measured; plan is 0 in scripted mode.
 */
import type { Span, Turn } from './trace';

export interface LatencyModel {
  asrMs: number;
  speakTtfbMs: number;
}

export interface FirstAudio {
  totalMs: number;
  asrMs: number;
  planMs: number;
  toolMs: number;
  speakMs: number;
  /** Excluded from the total: the person thinking. */
  elicitationMs: number;
}

const sum = (spans: Span[], kind: Span['kind']) => spans.filter((s) => s.kind === kind).reduce((n, s) => n + (s.endMs - s.startMs), 0);

export function firstAudio(turn: Turn): FirstAudio {
  const asrMs = sum(turn.spans, 'asr');
  const planMs = sum(turn.spans, 'plan');
  const elicitationMs = sum(turn.spans, 'elicitation');
  const toolMs = Math.max(0, sum(turn.spans, 'tool') - elicitationMs);
  const speakMs = sum(turn.spans, 'speak');
  return { totalMs: asrMs + planMs + toolMs + speakMs, asrMs, planMs, toolMs, speakMs, elicitationMs };
}
