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

// The big hits. Effects sit well under the voice: they punctuate, they never compete.
at('boom', 0, 0.28);
at('boom', word('intro', 2) - 3, 0.3);
at('riser', word('intro', 2) - f(1.5), 0.12);
at('boom', word('more1', 0) - 2, 0.3);
at('riser', word('more1', 0) - f(1.95), 0.16);
at('boom', word('tag', 0) - 4, 0.26);
// The camera travelling between scenes (the flip to the fixed build is quieter).
for (const s of SCENES.slice(1)) at('whoosh', S(s.name) - 22, s.name === 'after' ? 0.07 : 0.11);
// Stamps, with a soft buzz when something fails.
for (const [frame, fail] of [
  [word('why', 6), false], [word('intro', 24) + 6, true],
  [word('how3', 1) - 4, false], [word('how3', 3) - 4, false], [word('how3', 6) - 6, false],
  [word('red2', 18) - 2, false], [word('red2', 20) + 8, true], [word('after3', 0) + 2, false],
  [S('more') + f(CLIP_AT.agent) + Math.round((59.4 / AGENT_SPEED) * 60), false], [word('cheat2', 0) + 4, true],
] as Array<[number, boolean]>) {
  at('stamp', frame, 0.18);
  if (fail) at('buzz', frame + 2, 0.07);
}
// Green moments.
at('chime', word('after3', 0) + 4, 0.14);
at('chime', S('ci') + f(CLIP_AT.ci + CLIPS.ci.green) + 6, 0.14);
at('chime', S('more') + f(CLIP_AT.agent) + Math.round((CLIPS.agent.green / AGENT_SPEED) * 60), 0.11);
const fast = CLIPS.clone.installed / INSTALL_SPEED;
at('chime', S('offer') + f(CLIP_AT.clone + fast + (CLIPS.clone.output - CLIPS.clone.installed)) + 10, 0.12);
// The price.
at('swing', S('offer') + 2, 0.12);
at('kaching', word('offer', 3) - 4, 0.2);
// Sticky things landing.
for (const i of [12, 16, 22, 28]) at('pop', word('why', i) + 14, 0.07);
for (const i of [11, 16, 18, 20, 26]) at('pop', word('rules', i) + 2, 0.07);
for (const i of [4, 10]) at('pop', word('more1', i) + 2, 0.06);

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
