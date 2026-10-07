// Renders Film5 for upload (docs/09) in one go: the music bed rebuilt for the current cut, the voices
// de-essed, the mix measured and set to -14 LUFS, and one file, the 4K master for YouTube (a 4K
// upload gets YouTube's better encode, which keeps small text sharp at 1080p too). --preview
// renders a fast 1080p for a listen first. Stops before the long render if the film would reach 3:00.
//   node render-film5.mjs hearsay-v53 [--preview]     (from video/, writes out/<name>-*.mp4)
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const [name, flag] = process.argv.slice(2);
if (!name || (flag && flag !== '--preview')) throw new Error('usage: node render-film5.mjs <name> [--preview]');
const preview = flag === '--preview';
process.chdir(fileURLToPath(new URL('.', import.meta.url)));

const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit' });
const seconds = (file) => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' });
function loudness(file) {
  const { stderr } = spawnSync('ffmpeg', ['-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' });
  const s = stderr.slice(stderr.lastIndexOf('Summary:'));
  return { lufs: +s.match(/I:\s+(-?[\d.]+) LUFS/)[1], peak: +s.match(/Peak:\s+(-?[\d.]+) dBFS/)[1] };
}
const ffmpeg = (args) => run('ffmpeg', ['-v', 'error', '-y', ...args]);
const remotion = (out, args) => run('npx', ['remotion', 'render', 'src/index.ts', 'Film5', out, '--log=error', ...args]);

// The bed is built from the cut in plan.ts: rebuild it whenever the timing changed.
run('npx', ['tsx', 'sound/make-bed-v5.ts']);
spawnSync('node', ['voice/deess.mjs', 'voice/film-v5.json', 'voice/polly-v5.json'], { stdio: ['ignore', 'ignore', 'inherit'] });
run('npx', ['tsc', '--noEmit']);

// The mix alone first (a minute): its length gates the render, its loudness sets the gain.
const mix = `out/${name}-mix.mp3`;
remotion(mix, ['--codec=mp3']);
const length = seconds(mix);
if (length >= 179.5) throw new Error(`the film runs ${length.toFixed(1)} s; it has to stay under 3:00`);
const gain = Math.round((-14 - loudness(mix).lufs) * 10) / 10;
console.log(`mix: ${length.toFixed(1)} s, gain ${gain} dB to -14 LUFS`);

const raw = preview ? `out/${name}-preview-raw.mp4` : `out/${name}-4k.mp4`;
const master = preview ? `out/${name}-preview.mp4` : `out/${name}-4k-final.mp4`;
remotion(raw, preview ? ['--crf=20', '--x264-preset=veryfast'] : ['--scale=2', '--crf=14', '--x264-preset=slow', '--jpeg-quality=100', '--color-space=bt709']);
ffmpeg(['-i', raw, '-c:v', 'copy', '-af', `volume=${gain}dB,alimiter=limit=0.85:level=disabled`, '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', master]);
const { lufs, peak } = loudness(master);
console.log(`${master}: ${seconds(master).toFixed(1)} s, ${lufs} LUFS, true peak ${peak} dBFS`);
