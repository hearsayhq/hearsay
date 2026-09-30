/** The film's clock: every scene and subtitle follows the voice timeline (voice/film.json). */
import tl from '../../public/voice/film.timeline.json';

export const FPS = 60;
export const LEAD = 30;
const PRE = 24;
export const END_CARD = 330;

export type Who = 'narrator' | 'customer' | 'addon';
export interface Line {
  id: string;
  who: Who;
  scene: string;
  text: string;
  src: string;
  at: number;
  to: number;
  parts?: Array<{ text: string; at: number; to: number }>;
}

const f = (s: number) => LEAD + Math.round(s * FPS);
export const LINES: Line[] = tl.lines.map((l) => ({
  id: l.id,
  who: l.who as Who,
  scene: (l as { scene?: string }).scene ?? '',
  text: l.text,
  src: l.src,
  at: f(l.start),
  to: f(l.end),
  ...('parts' in l && l.parts ? { parts: (l.parts as Array<{ text: string; start: number; end: number }>).map((p) => ({ text: p.text, at: f(p.start), to: f(p.end) })) } : {}),
}));

export const SCENES = ['intro', 'what', 'journey', 'problem', 'agent', 'experiment', 'consent', 'close'] as const;
export type SceneName = (typeof SCENES)[number];

const starts = SCENES.map((s) => Math.max(0, LINES.find((l) => l.scene === s)!.at - PRE));
export const FILM_FRAMES = LINES[LINES.length - 1]!.to + END_CARD;
export const window = (s: SceneName) => {
  const i = SCENES.indexOf(s);
  const from = i === 0 ? 0 : starts[i]!;
  const to = i < SCENES.length - 1 ? starts[i + 1]! : FILM_FRAMES;
  return { from, frames: to - from };
};

/** A scene's lines with frames relative to the scene's start. */
export function linesOf(s: SceneName) {
  const { from } = window(s);
  const rel = (l: Line): Line => ({ ...l, at: l.at - from, to: l.to - from, ...(l.parts ? { parts: l.parts.map((p) => ({ ...p, at: p.at - from, to: p.to - from })) } : {}) });
  return Object.fromEntries(LINES.filter((l) => l.scene === s).map((l) => [l.id, rel(l)])) as Record<string, Line>;
}
