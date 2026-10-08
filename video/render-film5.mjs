// Renders Film5 for upload (docs/09) in one go: the music bed rebuilt for the current cut, the voices
// de-essed, the mix measured and set to -14 LUFS, and one file, the 4K master for YouTube (a 4K
// upload gets YouTube's better encode, which keeps small text sharp at 1080p too). --preview
// renders a fast 1080p for a listen first. Stops before the long render if the film would reach 3:00.
//   node render-film5.mjs hearsay-v53 [--preview]     (from video/, writes out/<name>-*.mp4)
//   COMP=Film6 node render-film5.mjs hearsay-v6 [--preview|--1440]   (film v6: same voices and cut, its own effects)
// --1440 renders 2560×1440 with the master's settings: YouTube's better encode starts at 1440p, so
// small text stays sharp at a third of the 4K render time.
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const [name, flag] = process.argv.slice(2);
if (!name || (flag && flag !== '--preview' && flag !== '--1440')) throw new Error('usage: node render-film5.mjs <name> [--preview|--1440]');
const preview = flag === '--preview';
const qhd = flag === '--1440';
process.chdir(fileURLToPath(new URL('.', import.meta.url)));

const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit' });
const seconds = (file) => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' });
function loudness(file) {
  const { stderr } = spawnSync('ffmpeg', ['-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' });
  const s = stderr.slice(stderr.lastIndexOf('Summary:'));
  return { lufs: +s.match(/I:\s+(-?[\d.]+) LUFS/)[1], peak: +s.match(/Peak:\s+(-?[\d.]+) dBFS/)[1] };
}
const ffmpeg = (args) => run('ffmpeg', ['-v', 'error', '-y', ...args]);
const comp = process.env.COMP ?? 'Film5';
const remotion = (out, args) => run('npx', ['remotion', 'render', 'src/index.ts', comp, out, '--log=error', ...args]);

// The bed is built from the cut in plan.ts: rebuild it whenever the timing changed.
run('npx', ['tsx', 'sound/make-bed-v5.ts']);
spawnSync('node', ['voice/deess.mjs', 'voice/film-v5.json', 'voice/polly-v5.json'], { stdio: ['ignore', 'ignore', 'inherit'] });
// Film v6 adds its own effects and draws its waveforms from the de-essed voices.
if (comp === 'Film6') { run('node', ['sound/make-sound-v6.mjs']); run('npx', ['tsx', 'sound/envelope-v6.ts']); }
run('npx', ['tsc', '--noEmit']);

// The mix alone first (a minute): its length gates the render, its loudness sets the gain.
const mix = `out/${name}-mix.mp3`;
remotion(mix, ['--codec=mp3']);
const length = seconds(mix);
if (length >= 179.5) throw new Error(`the film runs ${length.toFixed(1)} s; it has to stay under 3:00`);
const gain = Math.round((-14 - loudness(mix).lufs) * 10) / 10;
console.log(`mix: ${length.toFixed(1)} s, gain ${gain} dB to -14 LUFS`);

const tag = preview ? 'preview' : qhd ? '1440p' : '4k';
const raw = `out/${name}-${tag}-raw.mp4`;
const master = preview ? `out/${name}-preview.mp4` : `out/${name}-${tag}-final.mp4`;
const quality = ['--crf=14', '--x264-preset=slow', '--jpeg-quality=100', '--color-space=bt709'];
remotion(raw, preview ? ['--crf=20', '--x264-preset=veryfast'] : [qhd ? `--scale=${2560 / 1920}` : '--scale=2', ...quality]);
ffmpeg(['-i', raw, '-c:v', 'copy', '-af', `volume=${gain}dB,alimiter=limit=0.85:level=disabled`, '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', master]);
const { lufs, peak } = loudness(master);
console.log(`${master}: ${seconds(master).toFixed(1)} s, ${lufs} LUFS, true peak ${peak} dBFS`);
