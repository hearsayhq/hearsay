/**
 * Film v5's clock, the use-case cut: one narrator pitches one concrete use case and never says the
 * wake word; the customer and the add-on speak with Amazon Polly, word for word from the real runs.
 * Every narration line is a whole take, placed on what happens on screen. Word timings come from
 * whisper (voice/align.mjs). Scenes are listed with their length; placements are in seconds from
 * the scene's start.
 */
import { FPS } from '../theme';
import case1 from '../../public/voice/v5-case1.words.json';
import case2 from '../../public/voice/v5-case2.words.json';
import case3 from '../../public/voice/v5-case3.words.json';
import what from '../../public/voice/v5-what.words.json';
import how1 from '../../public/voice/v5-how1.words.json';
import how2 from '../../public/voice/v5-how2.words.json';
import how3 from '../../public/voice/v5-how3.words.json';
import rules from '../../public/voice/v5-rules.words.json';
import run from '../../public/voice/v5-run.words.json';
import red from '../../public/voice/v5-red.words.json';
import fix1 from '../../public/voice/v5-fix1.words.json';
import fix2 from '../../public/voice/v5-fix2.words.json';
import ci1 from '../../public/voice/v5-ci1.words.json';
import ci2 from '../../public/voice/v5-ci2.words.json';
import ci3 from '../../public/voice/v5-ci3.words.json';
import agent from '../../public/voice/v5-agent.words.json';
import cheat1 from '../../public/voice/v5-cheat1.words.json';
import cheat2 from '../../public/voice/v5-cheat2.words.json';
import tryIt from '../../public/voice/v5-try.words.json';
import tag from '../../public/voice/v5-tag.words.json';

type Take = { id: string; duration: number; words: Array<{ word: string; start: number; end: number }> };
const TAKES: Record<string, Take> = Object.fromEntries(
  [case1, case2, case3, what, how1, how2, how3, rules, run, red, fix1, fix2, ci1, ci2, ci3, agent, cheat1, cheat2, tryIt, tag].map((t) => [t.id.replace('v5-', ''), t as Take]),
);

/**
 * The real recordings. v4's tapes for the grocery runs, the CI log line and the locked suite
 * (public/clips/v4, main 9b4acdd); v5's agent session and fresh clone (public/clips/v5, main
 * 3cc07c5); GitHub's own pages for pull request #27, logged out (record/ci-github.mjs).
 */
export const CLIPS = {
  flawed: { src: 'clips/v4/orders-flawed.mp4', w: 3840, h: 2160, seconds: 15.64, output: 9.6 },
  fixed: { src: 'clips/v4/orders-fixed.mp4', w: 3840, h: 2160, seconds: 14.28, output: 8.9 },
  ci: { src: 'clips/v4/ci-pr27.mp4', w: 3840, h: 2160, seconds: 16.24, red: 5.6, grep: 9.8, green: 14.85 },
  cheat: { src: 'clips/v4/cheat.mp4', w: 3840, h: 2160, seconds: 10.88, output: 7.3 },
  clone: { src: 'clips/v5/clone.mp4', w: 3840, h: 2160, seconds: 18.04, installed: 10.4, output: 13.9 },
  agent: { src: 'clips/v5/agent-loop.mp4', w: 3420, h: 2484, seconds: 120.9, red: 21.0, green: 98.2, after: 117.78, untouched: 117.91 },
} as const;

/** GitHub's pages, captured at 2× (3200×1800), with the URL each came from. */
export const PAGES = {
  commits: { src: 'clips/v5/ci/pr-commits.png', url: 'github.com/hearsayhq/hearsay/pull/27/commits' },
  redJob: { src: 'clips/v5/ci/red-job.png', url: 'github.com/hearsayhq/hearsay/actions/runs/36779993236/job/110107538510' },
  redRun: { src: 'clips/v5/ci/red-run.png', url: 'github.com/hearsayhq/hearsay/actions/runs/36779993236' },
  greenJob: { src: 'clips/v5/ci/green-job.png', url: 'github.com/hearsayhq/hearsay/actions/runs/36780493038/job/110109224867' },
} as const;

/** A piece of a take: words [from, to) placed `at` seconds into the scene. */
type Seg = { line: string; at: number; from?: number; to?: number };
type Scene = { name: string; seconds: number; segs: Seg[] };
const S = (line: string, at: number, from?: number, to?: number): Seg => ({ line, at, ...(from !== undefined ? { from } : {}), ...(to !== undefined ? { to } : {}) });

export const SCENES: Scene[] = [
  { name: 'case', seconds: 19.0, segs: [S('case1', 0.6), S('case2', 7.3), S('case3', 12.4)] },
  { name: 'what', seconds: 13.4, segs: [S('what', 0.35)] },
  { name: 'how', seconds: 18.2, segs: [S('how1', 0.25), S('how2', 4.75), S('how3', 13.5)] },
  { name: 'rules', seconds: 13.8, segs: [S('rules', 0.3)] },
  // The flawed run, uncut: the clip starts at 0.15, its output lands at 0.15 + 9.6.
  { name: 'red', seconds: 19.2, segs: [S('run', 0.4), S('red', 10.0)] },
  { name: 'after', seconds: 13.4, segs: [S('fix1', 0.35), S('fix2', 11.6)] },
  { name: 'ci', seconds: 15.0, segs: [S('ci1', 0.3), S('ci2', 7.0), S('ci3', 12.2)] },
  { name: 'agent', seconds: 14.6, segs: [S('agent', 0.3)] },
  { name: 'cheat', seconds: 10.8, segs: [S('cheat1', 0.3), S('cheat2', 7.8)] },
  { name: 'offer', seconds: 18.0, segs: [S('try', 0.25), S('tag', 11.2)] },
];

/** The customer and the add-on (Amazon Polly, voice/polly-v5.json): scene, start, length, words. */
export const POLLY = [
  { id: 'p5-customer', scene: 'case', at: 5.1, seconds: 1.73, who: 'customer', text: 'Add fifteen dollars of fruit.' },
  { id: 'p5-flawed', scene: 'case', at: 11.1, seconds: 0.79, who: 'add-on', text: 'Added.' },
  { id: 'p5-fixed', scene: 'after', at: 6.0, seconds: 5.26, who: 'add-on', text: 'That would go over the total budget you gave me. You can add less, or give me a bigger budget.' },
] as const;

/** Where each clip starts in its scene, and how fast it plays (installs and the agent loop only). */
export const CLIP_AT = { flawed: 0.15, fixed: 0.1, cheat: 0.1, clone: 0.6, agent: 1.2 } as const;
export const AGENT_SPEED = 10;
export const INSTALL_SPEED = 2;

const starts: number[] = [];
let acc = 0;
for (const s of SCENES) { starts.push(acc); acc += s.seconds; }
export const FILM5_SECONDS = acc;
export const FILM5_FRAMES = Math.round(acc * FPS);
export const f = (s: number) => Math.round(s * FPS);
export const sceneStart = (name: string) => starts[SCENES.findIndex((s) => s.name === name)]!;
export const sceneFrames = (name: string) => f(SCENES.find((s) => s.name === name)!.seconds);
/** A Polly line's start, in frames from its scene's start. */
export const pollyAt = (id: string) => f(POLLY.find((p) => p.id === id)!.at);

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
