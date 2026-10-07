/**
 * Film v5's clock (v5.3), the use-case cut: one narrator pitches one concrete use case and never says the
 * wake word; the customer and the add-on speak with Amazon Polly, word for word from the real runs.
 * Every narration line is a whole take, placed on what happens on screen. Word timings come from
 * whisper (voice/align.mjs). Scenes are listed with their length; placements are in seconds from
 * the scene's start.
 */
import { FPS } from '../theme';
import open from '../../public/voice/v5-open.words.json';
import case1 from '../../public/voice/v5-case1.words.json';
import case2 from '../../public/voice/v5-case2.words.json';
import case3 from '../../public/voice/v5-case3.words.json';
import what from '../../public/voice/v5-what.words.json';
import how1 from '../../public/voice/v5-how1.words.json';
import how2 from '../../public/voice/v5-how2.words.json';
import how3 from '../../public/voice/v5-how3.words.json';
import rules from '../../public/voice/v5-rules.words.json';
import scan from '../../public/voice/v5-scan.words.json';
import run from '../../public/voice/v5-run.words.json';
import red from '../../public/voice/v5-red.words.json';
import fix1 from '../../public/voice/v5-fix1.words.json';
import fix1b from '../../public/voice/v5-fix1b.words.json';
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
  [open, case1, case2, case3, what, how1, how2, how3, rules, scan, run, red, fix1, fix1b, fix2, ci1, ci2, ci3, agent, cheat1, cheat2, tryIt, tag].map((t) => [t.id.replace('v5-', ''), t as Take]),
);

/**
 * The real recordings. v4's tapes for the grocery runs, the CI log line and the locked suite
 * (public/clips/v4, main 9b4acdd); v5's agent session (main 3cc07c5), Hearsay from npm in an
 * add-on's own project and the console run (public/clips/v5); GitHub's own pages for pull request #27, logged out
 * (record/ci-github.mjs).
 */
export const CLIPS = {
  flawed: { src: 'clips/v4/orders-flawed.mp4', w: 3840, h: 2160, seconds: 15.64, output: 9.6 },
  fixed: { src: 'clips/v4/orders-fixed.mp4', w: 3840, h: 2160, seconds: 14.28, output: 8.9 },
  ci: { src: 'clips/v4/ci-pr27.mp4', w: 3840, h: 2160, seconds: 16.24, red: 5.6, grep: 9.8, green: 14.85 },
  cheat: { src: 'clips/v4/cheat.mp4', w: 3840, h: 2160, seconds: 10.88, output: 7.3 },
  npx: { src: 'clips/v5/npx.mp4', w: 3840, h: 2160, seconds: 14.08, case: 2.8, output: 10.1 },
  agent: { src: 'clips/v5/agent-loop.mp4', w: 3420, h: 2484, seconds: 120.9, red: 21.0, green: 98.2, after: 117.78, untouched: 117.91 },
  // Hearsay's console (a web page whose engine is the MCP client) on the flawed grocery build,
  // record/console-v5.mjs, 7 Oct: connect, run the suite, open the runs, back to the verdict.
  console: { src: 'clips/v5/console.mp4', w: 3840, h: 2160, seconds: 10.54, connected: 1.13, run: 2.66, result: 4.5, runs: 4.79, top: 7.24 },
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
  { name: 'case', seconds: 24.6, segs: [S('open', 0.4), S('case1', 6.4), S('case2', 13.0), S('case3', 18.0)] },
  { name: 'what', seconds: 17.3, segs: [S('what', 0.45)] },
  { name: 'how', seconds: 21.4, segs: [S('how1', 0.25), S('how2', 5.25), S('how3', 14.3)] },
  { name: 'rules', seconds: 16.3, segs: [S('rules', 0.3)] },
  { name: 'scan', seconds: 7.9, segs: [S('scan', 0.45)] },
  // The flawed run from its run command on (the server start already on screen): its output lands
  // at 9.6 - 3.9. A beat before "Twenty errors" so the findings card can be read.
  { name: 'red', seconds: 18.1, segs: [S('run', 0.4), S('red', 8.4, 0, 15), S('red', 14.54, 15)] },
  { name: 'after', seconds: 24.2, segs: [S('fix1', 0.35), S('fix1b', 10.55), S('fix2', 22.6)] },
  { name: 'ci', seconds: 10.65, segs: [S('ci1', 0.3), S('ci2', 4.8), S('ci3', 7.85)] },
  { name: 'agent', seconds: 11.6, segs: [S('agent', 0.8)] },
  { name: 'cheat', seconds: 8.0, segs: [S('cheat1', 0.3), S('cheat2', 4.6)] },
  { name: 'offer', seconds: 18.4, segs: [S('try', 0.45), S('tag', 11.6)] },
];

/** The customer and the add-on (Amazon Polly, voice/polly-v5.json): scene, start, length, words. */
export const POLLY = [
  { id: 'p5-customer', scene: 'case', at: 10.9, seconds: 1.73, who: 'customer', text: 'Add fifteen dollars of fruit.' },
  { id: 'p5-flawed', scene: 'case', at: 16.8, seconds: 0.79, who: 'add-on', text: 'Added.' },
  { id: 'p5-fixed-clean', scene: 'after', at: 5.3, seconds: 4.87, who: 'add-on', text: 'Added fifteen dollars of fruit. Your cart is twenty-two dollars and forty cents.' },
  { id: 'p5-fixed', scene: 'after', at: 16.95, seconds: 5.26, who: 'add-on', text: 'That would go over the total budget you gave me. You can add less, or give me a bigger budget.' },
] as const;

/**
 * Where each clip starts in its scene (negative: the clip is already that far in when the scene
 * starts, so typing that only sets up is on screen already), and how fast the agent loop plays.
 */
export const CLIP_AT = { flawed: -3.9, fixed: 0.1, cheat: -3.0, npx: -0.9, agent: 0.6 } as const;
export const AGENT_SPEED = 14;

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
