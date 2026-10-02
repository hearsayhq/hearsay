/**
 * Music bed and effects (public/sound, synthesised by sound/make-sound.mjs; replaceable by Splice
 * samples of the same names). The bed ducks under the narration; every effect sits on a frame the
 * picture uses.
 */
import { Audio, Sequence, staticFile } from 'remotion';
import { AGENT_SPEED, CLIPS, CLIP_AT, f, FILM4_FRAMES, INSTALL_SPEED, PIECES, SCENES, sceneStart, word } from './plan';

const S = (name: string) => f(sceneStart(name));
const cues: Array<[string, number, number]> = [];
const at = (name: string, frame: number, volume: number) => cues.push([name, frame, volume]);

// The big hits.
at('boom', 0, 0.7);
at('boom', word('intro', 2) - 3, 0.85);
at('riser', word('intro', 2) - f(1.95), 0.55);
at('boom', word('more1', 0) - 2, 0.8);
at('riser', word('more1', 0) - f(1.95), 0.55);
at('boom', word('tag', 0) - 4, 0.7);
// The camera travelling between scenes (the flip to the fixed build is quieter).
for (const s of SCENES.slice(1)) at('whoosh', S(s.name) - 22, s.name === 'after' ? 0.22 : 0.38);
// Stamps, with a buzz when something fails.
for (const [frame, fail] of [
  [word('cold', 27), true], [word('prob', 6), false], [word('intro', 24) + 6, true],
  [word('how3', 1) - 4, false], [word('how3', 3) - 4, false], [word('how3', 6) - 6, false],
  [word('red2', 18) - 2, false], [word('red2', 20) + 8, true], [word('after', 15) + 2, false],
  [S('more') + f(CLIP_AT.agent) + Math.round((59.4 / AGENT_SPEED) * 60), false], [word('more2', 8) + 4, true],
] as Array<[number, boolean]>) {
  at('stamp', frame, 0.6);
  if (fail) at('buzz', frame + 2, 0.32);
}
// Green moments.
at('chime', word('after', 15) + 4, 0.45);
at('chime', S('ci') + f(CLIP_AT.ci + CLIPS.ci.green) + 6, 0.45);
at('chime', S('more') + f(CLIP_AT.agent) + Math.round((CLIPS.agent.green / AGENT_SPEED) * 60), 0.35);
const fast = CLIPS.clone.installed / INSTALL_SPEED;
at('chime', S('offer') + f(CLIP_AT.clone + fast + (CLIPS.clone.output - CLIPS.clone.installed)) + 10, 0.4);
// The price.
at('swing', S('offer') + 2, 0.45);
at('kaching', word('offer', 3) - 4, 0.6);
// Sticky things landing.
for (const w of [word('cold', 6) - 6, word('cold', 11) - 2, word('cold', 14), word('cold', 18), word('cold', 20), word('cold', 21) + 4, word('cold', 25)]) at('pop', w, 0.22);
for (const i of [12, 15, 19, 27]) at('pop', word('prob', i) + 14, 0.25);
for (const i of [11, 16, 18, 20, 26]) at('pop', word('rules', i) + 2, 0.25);
for (const i of [0, 3]) at('pop', word('how1', 3) + i * 7, 0.18);
for (const i of [4, 10]) at('pop', word('more1', i) + 2, 0.22);

/** Narration on or off, per frame, smoothed: the bed sits lower whenever someone speaks. */
const DUCK = (() => {
  const on = new Float32Array(FILM4_FRAMES + 1);
  for (const p of PIECES) for (let i = f(p.audioAt); i < f(p.audioAt + p.trimTo - p.trimFrom); i++) if (i >= 0 && i < on.length) on[i] = 1;
  const env = new Float32Array(on.length);
  let v = 0;
  for (let i = 0; i < on.length; i++) { v = on[i]! > v ? v + (on[i]! - v) * 0.25 : v + (on[i]! - v) * 0.04; env[i] = v; }
  return env;
})();

export function Sound() {
  return (
    <>
      <Audio src={staticFile('sound/v4-bed.wav')} volume={(fr) => 0.24 - 0.12 * (DUCK[Math.min(DUCK.length - 1, fr)] ?? 0)} />
      {cues.map(([name, frame, volume], i) => (
        <Sequence key={i} from={Math.max(0, frame)} durationInFrames={f(3.2)} name={`sfx ${name}`}>
          <Audio src={staticFile(`sound/${name}.wav`)} volume={volume} />
        </Sequence>
      ))}
    </>
  );
}
