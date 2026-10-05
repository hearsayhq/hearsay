/**
 * One continuous world: every scene sits at an anchor, and the camera travels between anchors at
 * each cut with a sticky overshoot and a small pull-back, so nothing cuts, everything moves on.
 */
import { Easing, interpolate } from 'remotion';
import { f, SCENES, sceneStart } from './plan';

export const ANCHOR: Record<string, [number, number]> = {
  case: [0, 0],
  what: [2400, 0],
  how: [2400, 1500],
  rules: [4800, 1500],
  red: [4800, 3000],
  after: [4800, 3000], // flips in place
  ci: [7200, 3000],
  agent: [7200, 4500],
  cheat: [9600, 4500],
  offer: [9600, 6000],
};

/** Frames the camera takes to travel, centred on the cut. */
export const TRAVEL = 44;
const back = Easing.bezier(0.7, -0.18, 0.25, 1.18);

export interface Cam { x: number; y: number; z: number; speed: number }

export function camera(frame: number): Cam {
  let cam: Cam = { x: ANCHOR.case![0], y: ANCHOR.case![1], z: 1, speed: 0 };
  for (let i = 1; i < SCENES.length; i++) {
    const cut = f(sceneStart(SCENES[i]!.name));
    const a = ANCHOR[SCENES[i - 1]!.name]!;
    const b = ANCHOR[SCENES[i]!.name]!;
    if (frame < cut - TRAVEL / 2) break;
    const p = interpolate(frame, [cut - TRAVEL / 2, cut + TRAVEL / 2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const e = back(p);
    const moving = a[0] !== b[0] || a[1] !== b[1];
    const dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const q = Math.max(0, Math.min(1, (frame - (cut - TRAVEL / 2) + 1) / TRAVEL));
    const speed = moving && p > 0 && p < 1 ? Math.abs(back(Math.min(1, q)) - back(Math.max(0, q - 1 / TRAVEL))) * dist : 0;
    cam = { x: a[0] + (b[0] - a[0]) * e, y: a[1] + (b[1] - a[1]) * e, z: moving ? 1 - 0.14 * Math.sin(Math.PI * p) : 1, speed };
  }
  return cam;
}
