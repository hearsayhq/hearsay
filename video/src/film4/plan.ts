/**
 * Film v4's clock, the infomercial cut: one narrator, every line cut from its take at word
 * boundaries (whisper word timings, voice/align.mjs) and placed on what happens on screen: the
 * tapes' measured events, the scene's own beats. Scenes are listed with their length; every
 * placement is in seconds from the scene's start.
 */
import { FPS } from '../theme';
import cold from '../../public/voice/v4-cold.words.json';
import prob from '../../public/voice/v4-prob.words.json';
import intro from '../../public/voice/v4-intro.words.json';
import how1 from '../../public/voice/v4-how1.words.json';
import how2 from '../../public/voice/v4-how2.words.json';
import how3 from '../../public/voice/v4-how3.words.json';
import rules from '../../public/voice/v4-rules.words.json';
import red1 from '../../public/voice/v4-red1.words.json';
import red2 from '../../public/voice/v4-red2.words.json';
import after from '../../public/voice/v4-after.words.json';
import ci from '../../public/voice/v4-ci.words.json';
import more1 from '../../public/voice/v4-more1.words.json';
import more2 from '../../public/voice/v4-more2.words.json';
import proof from '../../public/voice/v4-proof.words.json';
import offer from '../../public/voice/v4-offer.words.json';
import tag from '../../public/voice/v4-tag.words.json';

type Take = { id: string; duration: number; words: Array<{ word: string; start: number; end: number }> };
const TAKES: Record<string, Take> = Object.fromEntries(
  [cold, prob, intro, how1, how2, how3, rules, red1, red2, after, ci, more1, more2, proof, offer, tag].map((t) => [t.id.replace('v4-', ''), t as Take]),
);

/** The real recordings (public/clips/v4, from video/tapes/*-4k.tape and the agent-loop cast). */
export const CLIPS = {
  flawed: { src: 'clips/v4/orders-flawed.mp4', w: 3840, h: 2160, seconds: 15.64, output: 9.6 },
  fixed: { src: 'clips/v4/orders-fixed.mp4', w: 3840, h: 2160, seconds: 14.28, output: 8.9 },
  ci: { src: 'clips/v4/ci-pr27.mp4', w: 3840, h: 2160, seconds: 16.24, red: 5.6, grep: 9.8, green: 14.85 },
  cheat: { src: 'clips/v4/cheat.mp4', w: 3840, h: 2160, seconds: 10.88, output: 7.3 },
  clone: { src: 'clips/v4/clone.mp4', w: 3840, h: 2160, seconds: 17.08, installed: 8.3, output: 13.8 },
  agent: { src: 'clips/v4/agent-loop.mp4', w: 3420, h: 2484, seconds: 65.23, red: 13.9, green: 59.25 },
} as const;

/** A piece of a take: words [from, to) placed `at` seconds into the scene. */
type Seg = { line: string; at: number; from?: number; to?: number };
type Scene = { name: string; seconds: number; segs: Seg[] };
const S = (line: string, at: number, from?: number, to?: number): Seg => ({ line, at, ...(from !== undefined ? { from } : {}), ...(to !== undefined ? { to } : {}) });

export const SCENES: Scene[] = [
  { name: 'cold', seconds: 10.85, segs: [S('cold', 0.45)] },
  { name: 'prob', seconds: 12.15, segs: [S('prob', 0.2)] },
  { name: 'intro', seconds: 12.25, segs: [S('intro', 0.55)] },
  { name: 'how', seconds: 21.35, segs: [S('how1', 0.2), S('how2', 4.7), S('how3', 14.4)] },
  { name: 'rules', seconds: 12.5, segs: [S('rules', 0.25)] },
  // The flawed run, uncut: the clip starts at 0.15, its output lands at 0.15 + 9.6.
  { name: 'red', seconds: 18.3, segs: [S('red1', 0.4, 0, 7), S('red1', 5.5, 7), S('red2', 9.95)] },
  { name: 'after', seconds: 11.0, segs: [S('after', 0.35, 0, 5), S('after', 4.5, 5, 15), S('after', 9.15, 15)] },
  { name: 'ci', seconds: 16.7, segs: [S('ci', 0.15, 0, 6), S('ci', 2.25, 6, 16), S('ci', 6.35, 16, 24), S('ci', 11.6, 24, 26), S('ci', 15.6, 26)] },
  { name: 'more', seconds: 10.4, segs: [S('more1', 0.1, 0, 4), S('more1', 2.15, 4)] },
  { name: 'cheat', seconds: 8.7, segs: [S('more2', 0.25, 0, 4), S('more2', 1.5, 4, 8), S('more2', 7.55, 8)] },
  { name: 'proof', seconds: 12.4, segs: [S('proof', 0.25)] },
  { name: 'offer', seconds: 21.0, segs: [S('offer', 0.15, 0, 4), S('offer', 2.3, 4, 12), S('offer', 5.55, 12), S('tag', 15.7)] },
];

/** Where each clip starts in its scene, and how fast it plays (installs and the agent loop only). */
export const CLIP_AT = { flawed: 0.15, fixed: 0.1, ci: 0.6, cheat: 0.1, clone: 5.3, agent: 1.9 } as const;
export const AGENT_SPEED = 10;
export const INSTALL_SPEED = 2;

const starts: number[] = [];
let acc = 0;
for (const s of SCENES) { starts.push(acc); acc += s.seconds; }
export const FILM4_SECONDS = acc;
export const FILM4_FRAMES = Math.round(acc * FPS);
export const f = (s: number) => Math.round(s * FPS);
export const sceneStart = (name: string) => starts[SCENES.findIndex((s) => s.name === name)]!;
export const sceneFrames = (name: string) => f(SCENES.find((s) => s.name === name)!.seconds);

export interface Piece {
  line: string;
  scene: string;
  /** Word indexes [from, to) of the take this piece keeps. */
  from: number;
  to: number;
  /** Absolute seconds the first kept word starts at. */
  at: number;
  /** Absolute seconds the trimmed audio starts playing. */
  audioAt: number;
  /** Trim of the take, in seconds. */
  trimFrom: number;
  trimTo: number;
  words: Array<{ word: string; at: number; end: number }>;
}

/** Every placed piece with absolute times; audio trims keep a little room around the words. */
export const PIECES: Piece[] = SCENES.flatMap((scene, si) => scene.segs.map((seg) => {
  const take = TAKES[seg.line]!;
  const from = seg.from ?? 0;
  const to = seg.to ?? take.words.length;
  const first = take.words[from]!;
  const last = take.words[to - 1]!;
  const prevEnd = from > 0 ? take.words[from - 1]!.end : 0;
  const nextStart = to < take.words.length ? take.words[to]!.start : take.duration;
  const trimFrom = from === 0 ? 0 : Math.max(prevEnd, first.start - 0.08);
  const trimTo = to === take.words.length ? take.duration : Math.min(nextStart - 0.02, last.end + 0.18);
  const at = starts[si]! + seg.at;
  return {
    line: seg.line, scene: scene.name, from, to, at, audioAt: at - (first.start - trimFrom), trimFrom, trimTo,
    words: take.words.slice(from, to).map((w) => ({ word: w.word, at: at + (w.start - first.start), end: at + (w.end - first.start) })),
  };
}));

/** Absolute frame at which word `i` (index in the whole take) of `line` is spoken. */
export function word(line: string, i: number): number {
  const p = PIECES.find((q) => q.line === line && q.from <= i && i < q.to);
  if (!p) throw new Error(`no word ${i} in ${line}`);
  return f(p.words[i - p.from]!.at);
}

/** A word's frame relative to its scene's start. */
export const cue = (scene: string, line: string, i: number) => word(line, i) - f(sceneStart(scene));
