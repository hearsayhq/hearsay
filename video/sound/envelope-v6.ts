// Film v6's voice envelope: how loud the narrator and the Polly voices are on every frame of the
// film, from the same trimmed takes the film plays (src/film5/plan.ts). The picture draws its
// waveforms and the transcript band from it, so what moves is what you hear.
//   npx tsx sound/envelope-v6.ts      (writes src/film6/envelope.json)
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { FILM5_FRAMES, PIECES, POLLY, sceneStart } from '../src/film5/plan';

const RATE = 48000;
const PER_FRAME = RATE / 60;

function samples(file: string): Float32Array {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '1', '-ar', String(RATE), '-'], { maxBuffer: 2 ** 31 });
  return new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
}

function place(track: Float32Array, file: string, at: number, from: number, to: number) {
  const s = samples(file);
  const a = Math.round(from * RATE);
  const b = Math.min(s.length, Math.round(to * RATE));
  for (let fr = 0; ; fr++) {
    const i0 = a + Math.round(fr * PER_FRAME);
    if (i0 >= b) break;
    const i1 = Math.min(b, i0 + PER_FRAME);
    let sum = 0;
    for (let i = i0; i < i1; i++) sum += s[i]! * s[i]!;
    const k = Math.round(at * 60) + fr;
    if (k >= 0 && k < track.length) track[k] = Math.max(track[k]!, Math.sqrt(sum / Math.max(1, i1 - i0)));
  }
}

const narr = new Float32Array(FILM5_FRAMES);
const polly = new Float32Array(FILM5_FRAMES);
for (const p of PIECES) place(narr, `public/voice-ds/v5-${p.line}.wav`, p.audioAt, p.trimFrom, p.trimTo);
for (const p of POLLY) place(polly, `public/voice-ds/${p.id}.wav`, sceneStart(p.scene) + p.at, 0, p.seconds + 0.2);

// One scale for both, so a quiet voice looks quiet; 0–100 per frame.
const peak = Math.max(...narr, ...polly);
const q = (t: Float32Array) => Array.from(t, (v) => Math.round(Math.min(1, v / (peak * 0.8)) * 100));
writeFileSync('src/film6/envelope.json', JSON.stringify({ narr: q(narr), polly: q(polly) }));
console.log(`envelope: ${FILM5_FRAMES} frames, peak ${peak.toFixed(3)}`);
