// De-esser for every voice of a play: the takes keep their committed mp3s (public/voice), the film
// plays these copies (public/voice-ds, gitignored, rebuilt from the takes). Split at 4.5 kHz; the
// band above is compressed 3:1 from -24 dBFS, which takes the loudest "s" sounds down about 8 dB
// and leaves everything below the split untouched. Free and deterministic; needs ffmpeg.
//   node voice/deess.mjs voice/film-v5.json voice/polly-v5.json
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';

const OUT = 'public/voice-ds';
const FILTER = 'acrossover=split=4500:order=4th[lo][hi];[hi]acompressor=threshold=0.063:ratio=3:attack=0.5:release=40:knee=3:detection=rms[hc];[lo][hc]amix=inputs=2:normalize=0';

const files = process.argv.slice(2);
if (!files.length) throw new Error('usage: node voice/deess.mjs voice/<play>.json [more plays]');
mkdirSync(OUT, { recursive: true });
for (const file of files) {
  for (const line of JSON.parse(readFileSync(file, 'utf8')).lines) {
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', `public/voice/${line.id}.mp3`, '-filter_complex', FILTER, '-c:a', 'pcm_s16le', `${OUT}/${line.id}.wav`]);
    console.log(`${OUT}/${line.id}.wav`);
  }
}
