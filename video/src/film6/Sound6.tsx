/**
 * Film v6's music bed and effects. The bed is v5's (sound/make-bed-v5.ts, same cut); the effects
 * (sound/make-sound.mjs, sound/make-sound-v6.mjs) sit on the frames the v6 picture moves on: ticks
 * for things that land, swishes for shapes that become other shapes, a thud for full-frame colour,
 * a glitch for the mishearing. The bed ducks under every voice; booms fade within a second.
 */
import { Audio, Sequence, staticFile } from 'remotion';
import { CLIPS, CLIP_AT, cue, f, FILM5_FRAMES, PIECES, POLLY, sceneStart, word } from '../film5/plan';
import { AGENT_UI, AGENT_UI_SPEED } from './More';

const S = (name: string) => f(sceneStart(name));
const cues: Array<[string, number, number, number?]> = [];
const at = (name: string, frame: number, volume: number, fade?: number) => cues.push([name, frame, volume, fade]);

// 01 · the problem
at('boom', word('open', 2) - 3, 0.22, 54);
at('swish', word('open', 2) - 6, 0.05);
at('swish', word('open', 16) - 2, 0.05);
for (const i of [3, 6, 10]) at('tick', word('case1', i), 0.05);
at('glitch', word('case2', 4) - 4, 0.11);
at('tick', word('case2', 5) + 6, 0.045);
at('print', word('case3', 0) - 2, 0.08);
at('tick', word('case3', 5), 0.06);
at('buzz', word('case3', 5) + 2, 0.03);
for (let k = 0; k < 9; k++) at('key', word('case3', 7) + 8 + k * 4, 0.045);
at('tick', word('case3', 7) + 58, 0.04);
at('swish', word('case3', 13), 0.04);
at('swish', S('what') - 24, 0.07);
at('thud', S('what') - 4, 0.11);

// 02 · what it is
at('whoosh', S('what') + 2, 0.05);
at('boom', word('what', 0) - 3, 0.14, 54);
at('tick', S('what') + 20, 0.05);
at('swish', word('what', 3) - 10, 0.05);
for (let i = 0; i < 4; i++) at('tick', word('what', 17) + i * 5, 0.035);
at('tick', word('what', 19), 0.05);
const consoleIn = S('what') + Math.round((cue('what', 'what', 28) / 60 - 0.1 - CLIPS.console.run + 2.3) * 60);
at('whoosh', consoleIn - 6, 0.05);
for (const i of [28, 35, 38]) at('blip', word('what', i) + 6, 0.045);
at('buzz', word('what', 42) + 6, 0.045);
at('swish', S('how') - 30, 0.05);

// 03 · how it works
at('swish', S('how') + 2, 0.06);
for (const [l, i] of [['how1', 2], ['how1', 3], ['how1', 6], ['how1', 10]] as const) at('tick', word(l, i), 0.05);
at('swish', word('how2', 0), 0.05);
for (const i of [9, 11, 14]) at('tick', word('how2', i), 0.04);
at('blip', word('how2', 20), 0.045);
at('blip', word('how2', 20) + 8, 0.045);
at('buzz', word('how2', 20) + 16, 0.04);
at('whoosh', word('how3', 0) - 26, 0.05);
at('tick', word('how3', 0), 0.05);
for (let i = 0; i < 3; i++) at('tick', word('how3', 5) + 6 + i * 9, 0.03);
for (let i = 0; i < 6; i++) at('tick', word('how3', 12) - 6 + i * 7, 0.025);
at('whoosh', S('rules') - 40, 0.08);

// 04 · the rules
for (const i of [10, 16, 18, 22, 27]) at('pop', word('rules', i) + 2, 0.06);
at('swish', word('rules', 19), 0.04);
at('tick', word('rules', 35), 0.05);
at('thud', S('scan') - 6, 0.12);

// 05 · the scan
at('scan', word('scan', 0) - 6, 0.08);
at('pop', word('scan', 11), 0.08);
at('tick', S('red') - 30, 0.05);

// 06 · a real run
at('whoosh', S('red'), 0.06);
for (const fr of [word('red', 0), word('red', 8), word('red', 9) + 6]) at('tick', fr, 0.05);
at('tick', word('red', 15), 0.05);
at('thud', word('red', 17) - 2, 0.14);
at('stamp', word('red', 17), 0.12);
at('buzz', word('red', 17) + 2, 0.06);
at('swish', S('after'), 0.06);
at('tick', word('fix1b', 5), 0.04);
at('buzz', word('fix1b', 15), 0.035);
at('thud', word('fix2', 0) - 2, 0.12);
at('chime', word('fix2', 0) + 4, 0.1);

// 07 · on every change
at('swish', S('ci'), 0.06);
at('buzz', word('ci1', 2) + 4, 0.04);
at('swish', word('ci2', 0) - 14, 0.04);
at('buzz', word('ci2', 1), 0.05);
at('swish', word('ci3', 0) - 14, 0.04);
at('chime', word('ci3', 1) + 4, 0.1);

// 08 · for coding agents
const agentAt = (clipSec: number) => S('agent') + f(0.4) + Math.round((clipSec / AGENT_UI_SPEED) * 60);
at('swish', S('agent'), 0.05);
at('tick', word('agent', 0), 0.04);
at('tick', word('agent', 9), 0.04);
at('chime', agentAt(AGENT_UI.green) + 6, 0.1);
at('blip', agentAt(AGENT_UI.after) + 20, 0.045);
at('swish', S('cheat'), 0.05);
at('lock', S('cheat') + cue('cheat', 'cheat1', 7) + 4, 0.12);
at('stamp', word('cheat2', 4) + 4, 0.14);
at('buzz', word('cheat2', 4) + 6, 0.06);

// 09 · try it
at('thud', S('offer'), 0.08);
for (const i of [2, 5, 7]) at('thud', word('try', i) - 2, 0.1);
at('whoosh', word('try', 11) - 8, 0.05);
for (const i of [11, 16, 19]) at('tick', word('try', i), 0.04);
at('chime', S('offer') + f(CLIP_AT.npx + CLIPS.npx.output) + 10, 0.08);
at('swish', word('tag', 0) - 30, 0.06);
at('boom', word('tag', 0) - 4, 0.22, 54);
at('tick', word('tag', 6) + 10, 0.04);

/** Someone speaking, per frame, smoothed: the bed sits lower under every voice. */
const DUCK = (() => {
  const on = new Float32Array(FILM5_FRAMES + 1);
  const mark = (a: number, b: number) => { for (let i = f(a); i < f(b); i++) if (i >= 0 && i < on.length) on[i] = 1; };
  for (const p of PIECES) mark(p.audioAt, p.audioAt + p.trimTo - p.trimFrom);
  for (const p of POLLY) mark(sceneStart(p.scene) + p.at, sceneStart(p.scene) + p.at + p.seconds);
  const env = new Float32Array(on.length);
  let v = 0;
  for (let i = 0; i < on.length; i++) { v = on[i]! > v ? v + (on[i]! - v) * 0.25 : v + (on[i]! - v) * 0.04; env[i] = v; }
  return env;
})();

export function Sound6() {
  return (
    <>
      <Audio src={staticFile('sound/v5-bed.wav')} volume={(fr) => 0.22 - 0.12 * (DUCK[Math.min(DUCK.length - 1, fr)] ?? 0)} />
      {cues.map(([name, frame, volume, fade], i) => (
        <Sequence key={i} from={Math.max(0, frame)} durationInFrames={f(3.4)} name={`sfx ${name}`}>
          <Audio src={staticFile(`sound/${name}.wav`)} volume={fade ? (fr) => volume * Math.max(0, Math.min(1, 1 - (fr - 8) / fade)) : volume} />
        </Sequence>
      ))}
    </>
  );
}
