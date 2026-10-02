// The film's temporary sound: a 120 BPM music bed cut to film v4's hits, and the effects that
// Sound.tsx places on the picture. Synthesised here, so there is nothing to license; the owner can
// replace any file in public/sound with a Splice sample of the same name and length.
//   node sound/make-sound.mjs
import { mkdirSync } from 'node:fs';
import { Biquad, bass, clap, hat, kick, midi, noise, pad, pluck, reverb, riser, SR, Track, writeWav } from './synth.mjs';

const OUT = 'public/sound';
mkdirSync(OUT, { recursive: true });

// Hits from src/film4/plan.ts (scene start + word time): "Hearsay" lands, "But wait", "$0", "Hearsay." (tagline).
const HIT = { hearsay: 24.37, wait: 115.2, price: 146.75, zero: 147.93, tag: 162.3, end: 167.6 };
const BEAT = 0.5;
const BAR = 2;

const CHORDS = {
  tense: [{ bass: 41, notes: [53, 56, 60] }, { bass: 37, notes: [53, 56, 61] }, { bass: 44, notes: [56, 60, 63] }, { bass: 39, notes: [55, 58, 63] }],
  bright: [{ bass: 44, notes: [60, 63, 68] }, { bass: 39, notes: [58, 63, 67] }, { bass: 41, notes: [60, 65, 68] }, { bass: 37, notes: [61, 65, 68] }],
};

/**
 * Drums, bass and chords on a grid that starts at `from`, until `to`. `mix(t)` says what plays at
 * time t: { kick, clap, hats, open, bass, stabs, arp, pad } as gains (0 = off).
 */
function groove(music, from, to, prog, mix) {
  const bars = Math.ceil((to - from) / BAR);
  for (let b = 0; b < bars; b++) {
    const chord = prog[b % prog.length];
    for (let s = 0; s < 16; s++) {
      const t = from + b * BAR + (s * BEAT) / 4;
      if (t >= to - 0.01) continue;
      const m = mix(t);
      if (s % 4 === 0 && m.kick) music.drums.add(t, kick(0.42), 0.9 * m.kick);
      if ((s === 4 || s === 12) && m.clap) music.drums.add(t, clap(), 0.45 * m.clap, 0.05);
      if (m.hats && s % 2 === 1) music.drums.add(t, hat(), 0.16 * m.hats * (s % 4 === 3 ? 1 : 0.7), 0.25);
      if (m.hats && s % 2 === 0 && s % 4 !== 0) music.drums.add(t, hat(), 0.08 * m.hats, -0.2);
      if (m.open && s % 4 === 2) music.drums.add(t, hat(0.2, true), 0.12 * m.open, 0.3);
      if (m.bass && s % 4 === 2) music.bass.add(t, bass(chord.bass + (s === 6 || s === 14 ? 12 : 0), BEAT * 0.45), 0.55 * m.bass);
      if (m.stabs && s % 4 === 2) music.keys.add(t, pluck(chord.notes, 0.26, 0.8), 0.32 * m.stabs, s % 8 === 2 ? -0.35 : 0.35);
      if (m.arp) {
        const notes = [...chord.notes, chord.notes[0] + 12];
        music.keys.add(t, pluck([notes[s % notes.length] + 12], 0.2, 1), 0.15 * m.arp, ((s % 4) - 1.5) / 3);
      }
    }
    const m0 = mix(from + b * BAR);
    if (m0.pad) music.pads.add(from + b * BAR, pad(chord.notes.map((n) => n - 12), BAR + 0.3, 900), 0.22 * m0.pad);
  }
}

const len = HIT.end + 2.5;
const music = { drums: new Track(len), bass: new Track(len), keys: new Track(len), pads: new Track(len) };
const between = (t, a, b) => t >= a && t < b;

// A: the problem, minor and tight. It breaks for half a second when the add-on "breaks" (prob, word 11).
const BREAK = 10.85 + 0.2 + 4.14;
groove(music, 0, HIT.hearsay - 1.0, CHORDS.tense, (t) => {
  if (between(t, BREAK - 0.05, BREAK + 0.5)) return {};
  const later = t > 10.6;
  return { kick: 1, hats: later ? 1 : 0.6, clap: later ? 0.8 : 0, bass: later ? 1 : 0.5, arp: 1, pad: 0.6 };
});
// B: Hearsay, bright, from the hit. Quieter under the explanations and the real runs.
groove(music, HIT.hearsay, HIT.wait - 1.2, CHORDS.bright, (t) => {
  const demo = between(t, 69.1, 98.4);
  const explain = between(t, 35.25, 69.1);
  return { kick: 1, clap: demo ? 0.4 : explain ? 0.6 : 1, hats: 1, open: demo || explain ? 0 : 0.8, bass: 1, stabs: demo ? 0.35 : explain ? 0.6 : 1, pad: demo ? 0.5 : 0.8 };
});
// C: but wait, there's more. The same song, with more bounce; calmer under the numbers.
groove(music, HIT.wait, HIT.price - 0.05, CHORDS.bright, (t) => {
  const proof = t > 134.2;
  return { kick: 1, clap: 1, hats: 1, open: proof ? 0.4 : 1, bass: 1, stabs: proof ? 0.6 : 1, arp: proof ? 0 : 0.6, pad: 0.8 };
});
// D: the price. A held breath on "And the price?", then everything on "$0", and a ringing end.
groove(music, HIT.zero, HIT.tag, CHORDS.bright, () => ({ kick: 1, clap: 1, hats: 1, open: 0.8, bass: 1, stabs: 1, pad: 0.8 }));
music.pads.add(HIT.price, pad([56, 60, 63, 67], HIT.zero - HIT.price + 0.2, 700), 0.25);
music.pads.add(HIT.tag, pad([44, 56, 60, 63, 68], HIT.end - HIT.tag + 2.2, 1600), 0.5);
music.keys.add(HIT.tag, pluck([56, 60, 63, 68], 1.6, 1), 0.5);

// Fills into the two big hits.
for (const hit of [HIT.hearsay, HIT.wait]) {
  for (let i = 0; i < 8; i++) music.drums.add(hit - 1.0 + i * 0.125, clap(0.12), 0.18 + i * 0.04, (i % 2 ? 0.2 : -0.2));
}

// Sidechain: everything but the drums ducks under the kick.
const kicks = [];
for (const [from, to] of [[0, HIT.hearsay - 1.0], [HIT.hearsay, HIT.wait - 1.2], [HIT.wait, HIT.price - 0.05], [HIT.zero, HIT.tag]]) {
  for (let t = from; t < to - 0.01; t += BEAT) if (!between(t, BREAK - 0.05, BREAK + 0.5)) kicks.push(t);
}
const duck = new Float32Array(music.bass.n).fill(1);
for (const k of kicks) {
  const i0 = Math.round(k * SR);
  for (let i = 0; i < 0.3 * SR; i++) { const j = i0 + i; if (j < duck.length) duck[j] = Math.min(duck[j], 1 - 0.55 * Math.exp(-i / (0.09 * SR))); }
}

const mix = new Track(len);
for (const [name, g] of [['bass', 1], ['keys', 1], ['pads', 1]]) {
  const tr = music[name];
  for (let i = 0; i < tr.n; i++) { mix.L[i] += tr.L[i] * duck[i] * g; mix.R[i] += tr.R[i] * duck[i] * g; }
}
const keyVerb = reverb(music.keys, { room: 0.84, damp: 0.4 });
const padVerb = reverb(music.pads, { room: 0.88, damp: 0.5 });
const drumVerb = reverb(music.drums, { room: 0.7, damp: 0.5 });
mix.addStereo(0, music.drums, 1);
mix.addStereo(0, keyVerb, 0.35);
mix.addStereo(0, padVerb, 0.45);
mix.addStereo(0, drumVerb, 0.12);
// Gentle fade at the very end.
for (let i = 0; i < mix.n; i++) { const t = i / SR; if (t > HIT.end - 1.5) { const g = Math.max(0, (HIT.end + 1.5 - t) / 3); mix.L[i] *= g; mix.R[i] *= g; } }
writeWav(`${OUT}/v4-bed.wav`, mix, -1);
console.log(`v4-bed.wav ${len.toFixed(1)} s`);

// ---- Effects ----
function fx(name, seconds, fn, wet = 0) {
  const tr = new Track(seconds);
  fn(tr);
  if (wet) tr.addStereo(0, reverb(tr, { room: 0.8, damp: 0.4 }), wet);
  writeWav(`${OUT}/${name}.wav`, tr, -1);
  console.log(`${name}.wav`);
}

fx('boom', 3.0, (tr) => {
  const n = Math.round(2.6 * SR); const a = new Float32Array(n); let ph = 0; const lp = new Biquad('lowpass', 900, 0.7);
  for (let i = 0; i < n; i++) { const t = i / SR; ph += (34 + 60 * Math.exp(-t / 0.12)) / SR; a[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-t / 0.9) + lp.run(noise()) * 0.35 * Math.exp(-t / 0.25); }
  tr.add(0, a, 1);
}, 0.5);

fx('riser', 2.0, (tr) => { const r = riser(1.95); tr.add(0, r, 0.8, -0.3); tr.add(0.01, r, 0.8, 0.3); }, 0.3);

fx('whoosh', 0.75, (tr) => {
  const n = Math.round(0.7 * SR); const bp = new Biquad('bandpass', 400, 1.4);
  const L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const p = i / n; if (i % 32 === 0) bp.set(350 + 2600 * Math.sin(Math.PI * p), 1.4);
    const v = bp.run(noise()) * Math.pow(Math.sin(Math.PI * p), 2);
    L[i] = v * (1 - p); R[i] = v * p;
  }
  tr.add(0, L, 1.2, -0.6); tr.add(0, R, 1.2, 0.6);
});

fx('stamp', 0.6, (tr) => {
  const n = Math.round(0.4 * SR); const a = new Float32Array(n); let ph = 0; const lp = new Biquad('lowpass', 2200, 0.8); const bp = new Biquad('bandpass', 3200, 2);
  for (let i = 0; i < n; i++) { const t = i / SR; ph += (52 + 70 * Math.exp(-t / 0.03)) / SR; a[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-t / 0.13) * 0.9 + lp.run(noise()) * Math.exp(-t / 0.035) * 0.8 + bp.run(noise()) * Math.exp(-t / 0.012) * 0.6; }
  tr.add(0, a, 1);
}, 0.2);

fx('pop', 0.2, (tr) => {
  const n = Math.round(0.14 * SR); const a = new Float32Array(n); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; ph += (320 + 700 * Math.exp(-t / 0.018)) / SR; a[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-t / 0.045); }
  tr.add(0, a, 0.9);
});

fx('buzz', 0.7, (tr) => {
  const n = Math.round(0.55 * SR); const a = new Float32Array(n); const lp = new Biquad('lowpass', 1400, 0.9); let p1 = 0, p2 = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; p1 = (p1 + 98 / SR) % 1; p2 = (p2 + 104 / SR) % 1; a[i] = lp.run((p1 < 0.5 ? 1 : -1) + (p2 < 0.5 ? 1 : -1)) * 0.4 * Math.min(1, t / 0.005) * (t < 0.42 ? 1 : Math.max(0, 1 - (t - 0.42) / 0.12)); }
  tr.add(0, a, 0.9);
});

const bell = (f, len, gain) => {
  const n = Math.round(len * SR); const a = new Float32Array(n); let pc = 0, pm = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; pm += (f * 3.5) / SR; pc += f / SR; a[i] = Math.sin(2 * Math.PI * pc + 2.2 * Math.exp(-t / 0.25) * Math.sin(2 * Math.PI * pm)) * Math.exp(-t / 0.5) * gain; }
  return a;
};
fx('chime', 1.6, (tr) => { tr.add(0, bell(midi(88), 1.3, 0.6), 1, -0.2); tr.add(0.09, bell(midi(95), 1.3, 0.6), 1, 0.2); }, 0.35);
fx('kaching', 1.4, (tr) => {
  const n = Math.round(0.05 * SR); const a = new Float32Array(n); const bp = new Biquad('bandpass', 4200, 1.5);
  for (let i = 0; i < n; i++) a[i] = bp.run(noise()) * Math.exp(-i / (0.012 * SR)) * 1.5;
  tr.add(0, a, 1);
  tr.add(0.07, bell(2637, 1.1, 0.5), 1, -0.25); tr.add(0.075, bell(3951, 1.0, 0.35), 1, 0.25);
}, 0.3);
fx('swing', 0.6, (tr) => {
  const n = Math.round(0.5 * SR); const bp = new Biquad('bandpass', 900, 3); const a = new Float32Array(n);
  for (let i = 0; i < n; i++) { const p = i / n; if (i % 32 === 0) bp.set(600 + 900 * Math.sin(Math.PI * p), 3); a[i] = bp.run(noise()) * Math.sin(Math.PI * p) * 0.9; }
  tr.add(0, a, 1, 0.2);
});
