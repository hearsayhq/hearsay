/**
 * A telephone-quality channel in pure TypeScript (docs/04): white noise at a given SNR,
 * a 300–3400 Hz band, 16 kHz → 8 kHz. Seeded, so a recording can be reproduced.
 */
import { prng } from '../perturb/prng';

export const IN_RATE = 16_000;
export const OUT_RATE = 8_000;

interface Biquad {
  b0: number; b1: number; b2: number; a1: number; a2: number;
}

function biquad(type: 'low' | 'high', freq: number, rate: number, q = Math.SQRT1_2): Biquad {
  const w = (2 * Math.PI * freq) / rate;
  const alpha = Math.sin(w) / (2 * q);
  const cos = Math.cos(w);
  const a0 = 1 + alpha;
  const b = type === 'low' ? [(1 - cos) / 2, 1 - cos, (1 - cos) / 2] : [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2];
  return { b0: b[0]! / a0, b1: b[1]! / a0, b2: b[2]! / a0, a1: (-2 * cos) / a0, a2: (1 - alpha) / a0 };
}

function filter(x: Float64Array, f: Biquad): Float64Array {
  const y = new Float64Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = f.b0 * x[i]! + f.b1 * x1 + f.b2 * x2 - f.a1 * y1 - f.a2 * y2;
    x2 = x1; x1 = x[i]!; y2 = y1; y1 = v; y[i] = v;
  }
  return y;
}

const rms = (x: Float64Array) => Math.sqrt(x.reduce((s, v) => s + v * v, 0) / Math.max(1, x.length));

export function phoneChannel(pcm16k: Int16Array, opts: { snrDb: number; seed: number }): Int16Array {
  const x = Float64Array.from(pcm16k);
  const rand = prng(opts.seed);
  const noiseRms = rms(x) / 10 ** (opts.snrDb / 20);
  for (let i = 0; i < x.length; i++) {
    // Box–Muller
    const u = Math.max(rand(), 1e-12);
    const v = rand();
    x[i]! += noiseRms * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  const band = filter(filter(x, biquad('high', 300, IN_RATE)), biquad('low', 3400, IN_RATE));
  const out = new Int16Array(Math.floor(band.length / 2));
  for (let i = 0; i < out.length; i++) out[i] = Math.max(-32768, Math.min(32767, Math.round(band[i * 2]!)));
  return out;
}

export function snrOf(clean: Int16Array, noisy: Int16Array): number {
  const c = Float64Array.from(clean);
  const n = Float64Array.from(noisy, (v, i) => v - clean[i]!);
  return 20 * Math.log10(rms(c) / rms(n));
}
