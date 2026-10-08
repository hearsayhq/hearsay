// Film v6's extra effects, for the motion it adds: a UI tick, a key, a mishearing glitch, a soft
// swish for shapes that become other shapes, a thud for full-frame colour, a check blip, the scan
// sweep, a receipt printer and a lock. Synthesised (sound/synth.mjs), so nothing to license.
// Every effect starts with a short attack: a sound that starts on a full-level sample clicks.
//   node sound/make-sound-v6.mjs      (writes public/sound/*.wav; v5's effects come from make-sound.mjs)
import { mkdirSync } from 'node:fs';
import { Biquad, midi, noise, reverb, SR, Track, writeWav } from './synth.mjs';

const OUT = 'public/sound';
mkdirSync(OUT, { recursive: true });

function fx(name, seconds, fn, wet = 0) {
  const tr = new Track(seconds);
  fn(tr);
  if (wet) tr.addStereo(0, reverb(tr, { room: 0.7, damp: 0.5 }), wet);
  writeWav(`${OUT}/${name}.wav`, tr, -1);
  console.log(`${name}.wav`);
}
const env = (t, attack, decay) => Math.min(1, t / attack) * Math.exp(-t / decay);
const buf = (seconds, f) => { const n = Math.round(seconds * SR); const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = f(i / SR, i); return a; };

// A dry UI tick: a band of noise and a short high sine.
fx('tick', 0.12, (tr) => {
  const bp = new Biquad('bandpass', 3400, 2.2);
  tr.add(0, buf(0.08, (t) => (bp.run(noise()) * 0.9 + Math.sin(2 * Math.PI * 1900 * t) * 0.35) * env(t, 0.0008, 0.012)), 1);
});

// A key: a click and the body of the key under it.
fx('key', 0.12, (tr) => {
  const hp = new Biquad('highpass', 1800, 0.8);
  const lp = new Biquad('lowpass', 900, 0.9);
  tr.add(0, buf(0.09, (t) => hp.run(noise()) * env(t, 0.0006, 0.006) * 0.8 + lp.run(noise()) * env(t, 0.002, 0.02) * 0.6), 1);
});

// The mishearing: a voice-band stutter that drops in pitch, chopped into grains.
fx('glitch', 0.45, (tr) => {
  const bp = new Biquad('bandpass', 1200, 4);
  let ph = 0;
  tr.add(0, buf(0.4, (t, i) => {
    if (i % 64 === 0) bp.set(1600 - 1200 * (t / 0.4), 4);
    ph += (440 - 260 * (t / 0.4)) / SR;
    const gate = Math.floor(t / 0.028) % 2 === 0 ? 1 : 0.15;
    return (bp.run(noise()) * 0.8 + Math.sign(Math.sin(2 * Math.PI * ph)) * 0.18) * gate * Math.min(1, t / 0.002) * (1 - t / 0.4);
  }), 1);
}, 0.15);

// A soft swish: air through a band that rises and falls, panned across.
fx('swish', 0.45, (tr) => {
  const bp = new Biquad('bandpass', 800, 1.1);
  const n = Math.round(0.42 * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const p = i / n;
    if (i % 32 === 0) bp.set(500 + 3800 * Math.sin(Math.PI * p * 0.9), 1.1);
    const v = bp.run(noise()) * Math.pow(Math.sin(Math.PI * p), 1.6);
    L[i] = v * (1 - p * 0.7);
    R[i] = v * (0.3 + p * 0.7);
  }
  tr.add(0, L, 1, -0.5);
  tr.add(0, R, 1, 0.5);
});

// A thud for a frame filling with colour: a short low body and a little air.
fx('thud', 0.9, (tr) => {
  let ph = 0;
  const lp = new Biquad('lowpass', 500, 0.8);
  tr.add(0, buf(0.8, (t) => { ph += (48 + 50 * Math.exp(-t / 0.05)) / SR; return Math.sin(2 * Math.PI * ph) * env(t, 0.003, 0.22) + lp.run(noise()) * env(t, 0.002, 0.05) * 0.5; }), 1);
}, 0.25);

// A check that passes: two quick rising tones.
fx('blip', 0.5, (tr) => {
  const tone = (f) => buf(0.16, (t) => Math.sin(2 * Math.PI * f * t) * env(t, 0.003, 0.05));
  tr.add(0, tone(midi(84)), 0.7, -0.15);
  tr.add(0.06, tone(midi(91)), 0.7, 0.15);
}, 0.3);

// The scan line: a filtered sweep that rises over its length, with a faint ticking under it.
fx('scan', 3.2, (tr) => {
  const bp = new Biquad('bandpass', 400, 6);
  tr.add(0, buf(3.1, (t, i) => {
    const p = t / 3.1;
    if (i % 32 === 0) bp.set(300 + 3200 * p * p, 6);
    const tick = (t % 0.06) < 0.002 ? 0.5 : 0;
    return (bp.run(noise()) * 1.4 + tick * Math.sin(2 * Math.PI * 2600 * t)) * Math.min(1, t / 0.2) * Math.min(1, (3.1 - t) / 0.15) * (0.4 + 0.6 * p);
  }), 1);
}, 0.2);

// A receipt printing: a run of small mechanical ticks.
fx('print', 0.6, (tr) => {
  const bp = new Biquad('bandpass', 2400, 3);
  tr.add(0, buf(0.55, (t) => bp.run(noise()) * ((t % 0.022) < 0.004 ? 1 : 0.1) * Math.min(1, t / 0.003) * (1 - t / 0.55)), 1);
});

// A lock: two clicks, the second heavier.
fx('lock', 0.4, (tr) => {
  const click = (f, g) => { const bp = new Biquad('bandpass', f, 3); return buf(0.06, (t) => bp.run(noise()) * env(t, 0.0005, 0.008) * g); };
  tr.add(0, click(4200, 0.7), 1);
  tr.add(0.07, click(1800, 1), 1);
  tr.add(0.07, buf(0.12, (t) => Math.sin(2 * Math.PI * 140 * t) * env(t, 0.002, 0.03) * 0.6), 1);
}, 0.1);
