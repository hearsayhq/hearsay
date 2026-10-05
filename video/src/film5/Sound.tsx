/**
 * Music bed and effects (public/sound: the bed from sound/make-bed-v5.ts, the effects from
 * sound/make-sound.mjs). The bed ducks under every voice; every effect sits on a frame the picture
 * uses.
 */
import { Audio, Sequence, staticFile } from 'remotion';
import { AGENT_SPEED, CLIPS, CLIP_AT, f, FILM5_FRAMES, INSTALL_SPEED, PIECES, POLLY, SCENES, sceneStart, word } from './plan';

const S = (name: string) => f(sceneStart(name));
const cues: Array<[string, number, number]> = [];
const at = (name: string, frame: number, volume: number) => cues.push([name, frame, volume]);

// The two big moments: "Hearsay" lands, and the tagline.
at('riser', word('what', 2) - f(1.5), 0.1);
at('boom', word('what', 2) - 3, 0.26);
at('boom', word('tag', 0) - 4, 0.24);
// The camera travelling between scenes (the flip to the fixed build is quieter).
for (const s of SCENES.slice(1)) at('whoosh', S(s.name) - 22, s.name === 'after' ? 0.06 : 0.09);
// Stamps, with a soft buzz when something fails.
const agentGreen = S('agent') + f(CLIP_AT.agent) + Math.round((CLIPS.agent.green / AGENT_SPEED) * 60);
for (const [frame, fail] of [
  [word('how3', 1) - 4, false], [word('how3', 4) - 6, false], [word('how3', 7) - 6, false],
  [word('red', 17) + 8, true], [word('fix2', 0) + 2, false], [agentGreen + 4, false], [word('cheat2', 4) + 4, true],
] as Array<[number, boolean]>) {
  at('stamp', frame, 0.16);
  if (fail) at('buzz', frame + 2, 0.06);
}
// Green moments.
at('chime', word('fix2', 0) + 4, 0.12);
at('chime', word('ci3', 0) + 6, 0.12);
at('chime', agentGreen + 6, 0.1);
const fast = CLIPS.clone.installed / INSTALL_SPEED;
at('chime', S('offer') + f(CLIP_AT.clone + fast + (CLIPS.clone.output - CLIPS.clone.installed)) + 10, 0.1);
// Rule cards landing.
for (const i of [10, 16, 18, 22, 27]) at('pop', word('rules', i) + 2, 0.06);

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

export function Sound() {
  return (
    <>
      <Audio src={staticFile('sound/v5-bed.wav')} volume={(fr) => 0.22 - 0.12 * (DUCK[Math.min(DUCK.length - 1, fr)] ?? 0)} />
      {cues.map(([name, frame, volume], i) => (
        <Sequence key={i} from={Math.max(0, frame)} durationInFrames={f(3.2)} name={`sfx ${name}`}>
          <Audio src={staticFile(`sound/${name}.wav`)} volume={volume} />
        </Sequence>
      ))}
    </>
  );
}
