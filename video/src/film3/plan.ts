/**
 * Script v3's clock (docs/09). Scenes are built around real recordings that play uncut (rule 4);
 * voices are placed on what happens in them: the console's logged events, the tapes' moments.
 */
import tl from '../../public/voice/film-v3.timeline.json';
import cg from '../data/console-green.timeline.json';

export const FPS = 60;
export type Who = 'narrator' | 'customer' | 'addon';
type Raw = { id: string; who: string; scene?: string; text: string; start: number; end: number; src: string; parts?: Array<{ text: string; start: number; end: number }> };
const RAW = Object.fromEntries((tl.lines as Raw[]).map((l) => [l.id.replace('v3-', ''), l]));
const len = (id: string) => RAW[id]!.end - RAW[id]!.start;

export const CLIPS = { red: 15.12, loop: 15.37, cheat: 13.84, console: 46.03, clone: 15.32 };
const ev = (what: string, id: string) => {
  const off = cg.t0Epoch - cg.firstFrameEpoch;
  return cg.events.find((e) => e.what === what && (e as { id?: string }).id === id)!.t + off;
};

/** Lines one after another with the play's own gaps, from `from` seconds into the scene. */
function sequence(ids: string[], from: number): Array<[string, number]> {
  const first = RAW[ids[0]!]!.start;
  return ids.map((id) => [id, from + RAW[id]!.start - first]);
}

type Plan = { name: string; seconds: number; lines: Array<[string, number]> };
const G = (id: string, at: number): [string, number] => [id, at];
export const PLAN: Plan[] = [
  { name: 'cold', seconds: 14.2, lines: sequence(['k-c1', 'k-a1', 'k-c2', 'k-a2', 'k-c3', 'k-a3', 'k-c4', 'k-a4'], 0.5) },
  { name: 'intro', seconds: 12.2, lines: sequence(['i0', 'i1', 'i3'], 0.3) },
  { name: 'what', seconds: 10.0, lines: [['w1', 0.35]] },
  { name: 'red', seconds: CLIPS.red + 3.0, lines: [['r1', 1.0], ['r2', 8.1], ['r3', 13.6]] },
  { name: 'agent', seconds: CLIPS.loop + CLIPS.cheat, lines: [['a1', 0.8], ['a2', CLIPS.loop + 6.0]] },
  {
    name: 'green',
    seconds: CLIPS.console + 2.4,
    lines: [
      G('g0', 0.3),
      G('g-c1', ev('type', 'grant')),
      G('g-c2', ev('answered', 'grant') - len('g-c2') - 0.1),
      G('g-c3', ev('type', 'fruit')),
      G('g-a1', ev('reply', 'fruit') + 0.15),
      G('g-c4', ev('type', 'milk')),
      G('g-a2', ev('reply', 'milk') + 0.15),
      G('g-c5', ev('type', 'order')),
      G('g-a3', ev('dialog', 'order') + 0.15),
      G('g-c6', ev('answered', 'order') - len('g-c6') - 0.1),
      G('g-a4', ev('reply', 'order') + 0.15),
      G('g1', ev('reply', 'order') + 0.15 + len('g-a4') + 0.35),
    ],
  },
  { name: 'how', seconds: len('h1') + 1.0, lines: [['h1', 0.4]] },
  { name: 'proof', seconds: len('p1') + 1.2, lines: [['p1', 0.4]] },
  { name: 'close', seconds: CLIPS.clone + 3.9, lines: [['z1', 5.6]] },
];

export interface Line { id: string; who: Who; text: string; src: string; at: number; to: number; parts?: Array<{ text: string; at: number }> }
const starts: number[] = [];
let acc = 0;
for (const p of PLAN) { starts.push(acc); acc += Math.round(p.seconds * FPS); }
export const FILM3_FRAMES = acc;
export const sceneWindow = (name: string) => { const i = PLAN.findIndex((p) => p.name === name); return { from: starts[i]!, frames: Math.round(PLAN[i]!.seconds * FPS) }; };

/** Every line with frames relative to its scene, and absolute ones for audio and subtitles. */
export function linesOf(name: string): Record<string, Line> {
  const p = PLAN.find((x) => x.name === name)!;
  return Object.fromEntries(p.lines.map(([id, at]) => {
    const r = RAW[id]!;
    const a = Math.round(at * FPS);
    return [id, { id, who: r.who as Who, text: r.text, src: r.src, at: a, to: a + Math.round(len(id) * FPS), ...(r.parts ? { parts: r.parts.map((q) => ({ text: q.text, at: a + Math.round((q.start - r.start) * FPS) })) } : {}) }];
  }));
}
export const ALL_LINES: Line[] = PLAN.flatMap((p) => Object.values(linesOf(p.name)).map((l) => ({ ...l, at: l.at + sceneWindow(p.name).from, to: l.to + sceneWindow(p.name).from })));
