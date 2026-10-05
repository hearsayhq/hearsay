// Film v5's music bed: calmer than v4's (a keynote, not an infomercial), on one grid from the
// moment "Hearsay" is first said to the tagline, thinner under the demos. Synthesised, so there is
// nothing to license. Reads the cut from src/film5/plan.ts.
//   npx tsx sound/make-bed-v5.ts
import { mkdirSync } from 'node:fs';
// @ts-expect-error plain ESM helpers without types
import { bass, hat, kick, pad, pluck, reverb, SR, Track, writeWav } from './synth.mjs';
import { f, FILM5_SECONDS, sceneStart, word } from '../src/film5/plan';

const OUT = 'public/sound';
mkdirSync(OUT, { recursive: true });
const sec = (frame: number) => frame / 60;
const HIT = { hearsay: sec(word('what', 2)), tag: sec(word('tag', 0)), end: FILM5_SECONDS };
const S = (name: string) => sceneStart(name);
const BEAT = 60 / 104;
const BAR = BEAT * 4;

const CHORDS = {
  soft: [{ bass: 44, notes: [60, 63, 68] }, { bass: 41, notes: [60, 65, 68] }, { bass: 37, notes: [61, 65, 68] }, { bass: 39, notes: [58, 63, 67] }],
  tense: [{ bass: 41, notes: [53, 56, 60] }, { bass: 37, notes: [53, 56, 61] }, { bass: 44, notes: [56, 60, 63] }, { bass: 39, notes: [55, 58, 63] }],
};
type Mix = { prog: typeof CHORDS.soft; kick?: number; hats?: number; bass?: number; stabs?: number; pad?: number; arp?: number };

/** What plays at time t, by scene: present, never loud, thinner under the demos. */
function section(t: number): Mix | null {
  if (t >= HIT.tag) return null;
  if (t < S('what')) return t > sec(word('case2', 0)) ? { prog: CHORDS.tense, pad: 0.8, arp: 0.45 } : { prog: CHORDS.soft, pad: 0.8, arp: 0.4 };
  if (t < S('red')) return { prog: CHORDS.soft, kick: 0.7, hats: 0.6, bass: 0.7, stabs: 0.45, pad: 0.7 };
  if (t < S('agent')) return { prog: t < S('after') ? CHORDS.tense : CHORDS.soft, kick: 0.5, hats: 0.35, bass: 0.6, pad: 0.6 };
  if (t < S('offer')) return { prog: CHORDS.soft, kick: 0.75, hats: 0.6, bass: 0.75, stabs: 0.5, pad: 0.7, arp: 0.3 };
  return { prog: CHORDS.soft, kick: 0.8, hats: 0.65, bass: 0.8, stabs: 0.55, pad: 0.75 };
}

const len = HIT.end + 3;
const music = { drums: new Track(len), bass: new Track(len), keys: new Track(len), pads: new Track(len) };
const kicks: number[] = [];
// The grid starts before "Hearsay" so that word lands on a downbeat; before it, only pads and arps.
const t0 = HIT.hearsay - Math.ceil(HIT.hearsay / BAR) * BAR;
for (let s16 = 0; ; s16++) {
  const t = t0 + (s16 * BEAT) / 4;
  if (t < 0) continue;
  if (t >= HIT.tag - 0.01) break;
  const m = section(t);
  if (!m) break;
  const beatsIn = t < HIT.hearsay;
  const bar = Math.floor(s16 / 16);
  const s = s16 % 16;
  const chord = m.prog[bar % m.prog.length]!;
  if (!beatsIn && s % 4 === 0 && m.kick) { music.drums.add(t, kick(0.38), 0.75 * m.kick); kicks.push(t); }
  if (!beatsIn && m.hats && s % 2 === 1) music.drums.add(t, hat(), 0.12 * m.hats, 0.25);
  if (!beatsIn && m.bass && s % 8 === 0) music.bass.add(t, bass(chord.bass, BEAT * 1.6), 0.45 * m.bass);
  if (!beatsIn && m.stabs && s % 8 === 4) music.keys.add(t, pluck(chord.notes, 0.3, 0.8), 0.26 * m.stabs, s % 16 === 4 ? -0.3 : 0.3);
  if (m.arp && s % 2 === 0) { const notes = [...chord.notes, chord.notes[0]! + 12]; music.keys.add(t, pluck([notes[(s / 2) % notes.length]! + 12], 0.22, 1), 0.11 * m.arp, ((s % 4) - 1.5) / 3); }
  if (s === 0 && m.pad) music.pads.add(t, pad(chord.notes.map((n) => n - 12), BAR + 0.3, 900), 0.2 * m.pad);
}
// "Hearsay": a chord that swells into it. The ending: one bright chord under the end card.
music.pads.add(Math.max(0, HIT.hearsay - 2.5), pad([56, 60, 63, 68], 3, 1200), 0.35);
music.pads.add(HIT.tag, pad([44, 56, 60, 63, 68], HIT.end - HIT.tag + 2.5, 1600), 0.45);
music.keys.add(HIT.tag, pluck([56, 60, 63, 68], 1.6, 1), 0.4);
music.drums.add(HIT.tag, kick(0.6, 1.2), 0.6);

const duck = new Float32Array(music.bass.n).fill(1);
for (const k of kicks) {
  const i0 = Math.round(k * SR);
  for (let i = 0; i < 0.3 * SR; i++) { const j = i0 + i; if (j < duck.length) duck[j] = Math.min(duck[j]!, 1 - 0.4 * Math.exp(-i / (0.09 * SR))); }
}
const mix = new Track(len);
for (const name of ['bass', 'keys', 'pads'] as const) {
  const tr = music[name];
  for (let i = 0; i < tr.n; i++) { mix.L[i] += tr.L[i] * duck[i]!; mix.R[i] += tr.R[i] * duck[i]!; }
}
mix.addStereo(0, music.drums, 1);
mix.addStereo(0, reverb(music.keys, { room: 0.86, damp: 0.4 }), 0.4);
mix.addStereo(0, reverb(music.pads, { room: 0.9, damp: 0.5 }), 0.5);
mix.addStereo(0, reverb(music.drums, { room: 0.7, damp: 0.5 }), 0.1);
for (let i = 0; i < mix.n; i++) {
  const t = i / SR;
  const g = Math.min(1, t / 0.6, Math.max(0, (HIT.end + 2 - t) / 3));
  mix.L[i] *= g; mix.R[i] *= g;
}
writeWav(`${OUT}/v5-bed.wav`, mix, -1);
console.log(`v5-bed.wav ${len.toFixed(1)} s, 104 BPM, "Hearsay" at ${HIT.hearsay.toFixed(2)} s, tag at ${HIT.tag.toFixed(2)} s; frames ${f(len)}`);
