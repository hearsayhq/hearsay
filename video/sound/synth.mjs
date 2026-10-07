// A small offline synthesizer: oscillators, filters, envelopes, a reverb and a WAV writer. Used by
// make-sound.mjs for the film's temporary music bed and effects (no samples, no licences needed).
import { writeFileSync } from 'node:fs';

export const SR = 48000;

let seed = 12345;
/** Seeded noise, so every render is the same. */
export const noise = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2147483648 - 1; };

export const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

/** Band-limited saw (polyBLEP). */
export function saw(phase, dt) {
  let v = 2 * phase - 1;
  if (phase < dt) { const t = phase / dt; v -= t + t - t * t - 1; } else if (phase > 1 - dt) { const t = (phase - 1) / dt; v -= t * t + t + t + 1; }
  return v;
}

/** A biquad filter whose cutoff can change while it runs. */
export class Biquad {
  constructor(type = 'lowpass', freq = 1000, q = 0.707) { this.type = type; this.x1 = this.x2 = this.y1 = this.y2 = 0; this.set(freq, q); }
  set(freq, q = this.q) {
    this.freq = freq; this.q = q;
    const w = (2 * Math.PI * Math.min(freq, SR * 0.45)) / SR;
    const cos = Math.cos(w), alpha = Math.sin(w) / (2 * q);
    let b0, b1, b2;
    const a0 = 1 + alpha, a1 = -2 * cos, a2 = 1 - alpha;
    if (this.type === 'lowpass') { b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = (1 - cos) / 2; }
    else if (this.type === 'highpass') { b0 = (1 + cos) / 2; b1 = -(1 + cos); b2 = (1 + cos) / 2; }
    else { b0 = alpha; b1 = 0; b2 = -alpha; }
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = a1 / a0; this.a2 = a2 / a0;
  }
  run(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y;
    return y;
  }
}

/** A stereo buffer with helpers to add sounds at a time. */
export class Track {
  constructor(seconds) { this.n = Math.ceil(seconds * SR); this.L = new Float32Array(this.n); this.R = new Float32Array(this.n); }
  add(at, mono, gain = 1, pan = 0) {
    const i0 = Math.round(at * SR);
    const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
    const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
    for (let i = 0; i < mono.length; i++) { const j = i0 + i; if (j < 0 || j >= this.n) continue; this.L[j] += mono[i] * gl; this.R[j] += mono[i] * gr; }
  }
  addStereo(at, other, gain = 1) {
    const i0 = Math.round(at * SR);
    for (let i = 0; i < other.n; i++) { const j = i0 + i; if (j < 0 || j >= this.n) continue; this.L[j] += other.L[i] * gain; this.R[j] += other.R[i] * gain; }
  }
}

/** Freeverb-style reverb, returning the wet signal only. */
export function reverb(track, { room = 0.82, damp = 0.35, wet = 1 } = {}) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((d) => Math.round((d * SR) / 44100));
  const aps = [556, 441, 341, 225].map((d) => Math.round((d * SR) / 44100));
  const out = new Track(track.n / SR);
  for (const [ch, spread] of [['L', 0], ['R', 23]]) {
    const src = track[ch];
    const dst = out[ch];
    const cb = combs.map((d) => ({ buf: new Float32Array(d + spread), i: 0, store: 0 }));
    const ab = aps.map((d) => ({ buf: new Float32Array(d + spread), i: 0 }));
    for (let n = 0; n < src.length; n++) {
      const x = src[n] * 0.015;
      let y = 0;
      for (const c of cb) { const o = c.buf[c.i]; c.store = o * (1 - damp) + c.store * damp; c.buf[c.i] = x + c.store * room; c.i = (c.i + 1) % c.buf.length; y += o; }
      for (const a of ab) { const o = a.buf[a.i]; const v = -y + o; a.buf[a.i] = y + o * 0.5; a.i = (a.i + 1) % a.buf.length; y = v; }
      dst[n] = y * wet;
    }
  }
  return out;
}

/** Peak-normalise, soft-clip and write 16-bit stereo WAV. */
export function writeWav(path, track, peakDb = -1) {
  let peak = 1e-9;
  for (let i = 0; i < track.n; i++) peak = Math.max(peak, Math.abs(track.L[i]), Math.abs(track.R[i]));
  const g = Math.pow(10, peakDb / 20) / peak;
  const data = Buffer.alloc(track.n * 4);
  for (let i = 0; i < track.n; i++) {
    const l = Math.tanh(track.L[i] * g * 1.1) / Math.tanh(1.1);
    const r = Math.tanh(track.R[i] * g * 1.1) / Math.tanh(1.1);
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, l)) * 32767), i * 4);
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, r)) * 32767), i * 4 + 2);
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
  writeFileSync(path, Buffer.concat([h, data]));
}

// ---- Instruments: each returns a mono Float32Array ----

export function kick(len = 0.42, punch = 1) {
  const n = Math.round(len * SR); const out = new Float32Array(n); let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 46 + 110 * Math.exp(-t / 0.035) * punch;
    ph += f / SR;
    out[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-t / 0.26) + (i < 140 ? noise() * 0.3 * (1 - i / 140) : 0);
  }
  return out;
}

export function clap(len = 0.35) {
  const n = Math.round(len * SR); const out = new Float32Array(n); const bp = new Biquad('bandpass', 1300, 0.9);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const bursts = [0, 0.011, 0.022].reduce((a, d) => a + (t >= d ? Math.exp(-(t - d) / (d === 0.022 ? 0.12 : 0.007)) : 0), 0);
    out[i] = bp.run(noise()) * bursts * 1.6;
  }
  return out;
}

export function hat(len = 0.05, open = false) {
  const n = Math.round((open ? 0.22 : len) * SR); const out = new Float32Array(n); const hp = new Biquad('highpass', 7500, 0.8);
  // A 1.5 ms attack and a 4 ms release: no hit starts or stops on a full-level sample (heard as a click).
  const dur = n / SR;
  for (let i = 0; i < n; i++) { const t = i / SR; out[i] = hp.run(noise()) * Math.min(1, t / 0.0015, (dur - t) / 0.004) * Math.exp(-t / (open ? 0.09 : 0.018)); }
  return out;
}

export function bass(note, len) {
  const n = Math.round(len * SR); const out = new Float32Array(n); const lp = new Biquad('lowpass', 520, 1.1);
  let p1 = 0, p2 = 0; const f = midi(note);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    p1 = (p1 + f / SR) % 1; p2 = (p2 + (f * 1.004) / SR) % 1;
    const env = Math.min(1, t / 0.004) * Math.exp(-t / (len * 0.9)) * (t > len - 0.01 ? (len - t) / 0.01 : 1);
    if (i % 32 === 0) lp.set(260 + 900 * Math.exp(-t / 0.06), 1.1);
    out[i] = (Math.sin(2 * Math.PI * p1) * 0.75 + lp.run(saw(p2, f / SR)) * 0.45) * env;
  }
  return out;
}

export function pluck(notes, len = 0.32, bright = 1) {
  const n = Math.round(len * SR); const out = new Float32Array(n); const lp = new Biquad('lowpass', 3000, 1.6);
  const ph = notes.flatMap(() => [0, 0]);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    if (i % 32 === 0) lp.set(500 + 3800 * bright * Math.exp(-t / 0.09), 1.6);
    let v = 0;
    notes.forEach((m, k) => {
      const f = midi(m);
      ph[2 * k] = (ph[2 * k] + (f * 0.997) / SR) % 1; ph[2 * k + 1] = (ph[2 * k + 1] + (f * 1.003) / SR) % 1;
      v += saw(ph[2 * k], f / SR) + saw(ph[2 * k + 1], f / SR);
    });
    out[i] = lp.run(v / (notes.length * 2)) * Math.min(1, t / 0.002) * Math.exp(-t / 0.16);
  }
  return out;
}

export function pad(notes, len, cutoff = 1400) {
  const n = Math.round(len * SR); const out = new Float32Array(n); const lp = new Biquad('lowpass', cutoff, 0.7);
  const det = [0.994, 1, 1.006];
  const ph = notes.flatMap(() => det.map(() => Math.random()));
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let v = 0;
    notes.forEach((m, k) => det.forEach((d, j) => { const f = midi(m) * d; const idx = k * 3 + j; ph[idx] = (ph[idx] + f / SR) % 1; v += saw(ph[idx], f / SR); }));
    const env = Math.min(1, t / 0.35) * Math.min(1, (len - t) / 0.4);
    out[i] = lp.run(v / (notes.length * 3)) * env;
  }
  return out;
}

export function riser(len = 2, from = 300, to = 7000) {
  const n = Math.round(len * SR); const out = new Float32Array(n); const bp = new Biquad('bandpass', from, 2.2);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const p = i / n;
    if (i % 32 === 0) bp.set(from * Math.pow(to / from, p), 2.2);
    ph += (200 + 900 * p * p) / SR;
    out[i] = (bp.run(noise()) * 1.4 + Math.sin(2 * Math.PI * ph) * 0.12) * Math.pow(p, 1.6);
  }
  return out;
}
