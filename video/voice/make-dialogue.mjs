// Renders a radio-play JSON (voice/*.json) with OpenAI gpt-4o-mini-tts, masters each line, and
// writes public/voice/<id>.mp3 plus public/voice/<name>.timeline.json (start and end of every
// line), so scenes cut to the audio. Needs OPENAI_API_KEY in the environment; never on screen.
//   node voice/make-dialogue.mjs voice/skit.json
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const file = process.argv[2];
// --reuse: master the takes already in out/voice-raw again, without asking the model for new ones.
const reuse = process.argv.includes('--reuse');
// --only a,b: ask the model again for these lines only; every other line reuses its take.
const only = (process.argv.find((a) => a.startsWith('--only=')) ?? '').slice(7).split(',').filter(Boolean);
if (!file) throw new Error('usage: node voice/make-dialogue.mjs voice/<play>.json [--reuse]');
if (!reuse && !process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set');
const play = JSON.parse(readFileSync(file, 'utf8'));
const out = 'public/voice';
const tmp = 'out/voice-raw';
mkdirSync(out, { recursive: true });
mkdirSync(tmp, { recursive: true });
const MASTER = 'aresample=48000,highpass=f=70,equalizer=f=220:t=q:w=1.1:g=-1.5,equalizer=f=3200:t=q:w=1.3:g=1.5,acompressor=threshold=-22dB:ratio=2.5:attack=6:release=90:makeup=2,loudnorm=I=-16:TP=-1.5:LRA=7';

/** The parts of a one-take line, from its pauses; spread by length when the pauses do not match. */
function findParts(mp3, seconds, parts) {
  const text = String(execFileSync('sh', ['-c', `ffmpeg -hide_banner -i '${mp3}' -af silencedetect=noise=-38dB:d=0.1 -f null - 2>&1`]));
  const starts = [...text.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
  const ends = [...text.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  let spans = [];
  let from = 0;
  for (let i = 0; i < starts.length; i++) {
    if (starts[i] - from > 0.08) spans.push({ start: from, end: starts[i] });
    from = ends[i] ?? seconds;
  }
  if (seconds - from > 0.08) spans.push({ start: from, end: seconds });
  // Merge across the shortest pauses until there are as many spans as parts.
  while (spans.length > parts.length) {
    let k = 0;
    for (let i = 1; i < spans.length - 1; i++) if (spans[i + 1].start - spans[i].end < spans[k + 1].start - spans[k].end) k = i;
    spans.splice(k, 2, { start: spans[k].start, end: spans[k + 1].end });
  }
  if (spans.length !== parts.length) {
    const total = parts.reduce((a, p) => a + p.length, 0);
    let acc = 0;
    spans = parts.map((p) => { const s = (acc / total) * seconds; acc += p.length; return { start: s, end: (acc / total) * seconds }; });
    console.log('  parts spread by length (pauses did not match)');
  }
  return parts.map((text, i) => ({ text, start: spans[i].start, end: spans[i].end }));
}

let t = 0;
const timeline = [];
for (const line of play.lines) {
  const raw = join(tmp, `${line.id}.wav`);
  if (!reuse && (!only.length || only.includes(line.id))) {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: play.model, voice: line.voice, input: line.text, instructions: line.direction, response_format: 'wav' }),
    });
    if (!res.ok) throw new Error(`${line.id}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
  }
  // Trim silence but keep 80 ms of room at both ends, fade the tail instead of cutting it, cap
  // pauses inside the line at a quarter second, and bring the pace up a little without changing pitch.
  const keep = 'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.08';
  const pauses = `silenceremove=stop_periods=-1:stop_duration=${(play.maxPauseMs ?? 300) / 1000}:stop_threshold=-42dB:stop_silence=${(play.keepPauseMs ?? 250) / 1000}`;
  const mp3 = join(out, `${line.id}.mp3`);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', raw, '-af', `${keep},areverse,${keep},afade=t=in:d=0.05,areverse,${pauses},atempo=${line.tempo ?? play.tempo ?? 1},${MASTER}`, '-c:a', 'libmp3lame', '-b:a', '192k', mp3]);
  const seconds = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3]).toString());
  t += line.gapBeforeMs / 1000;
  const entry = { id: line.id, who: line.who, ...(line.scene ? { scene: line.scene } : {}), text: line.text, start: +t.toFixed(3), end: +(t + seconds).toFixed(3), src: `voice/${line.id}.mp3` };
  if (line.parts) entry.parts = findParts(mp3, seconds, line.parts).map((p) => ({ ...p, start: +(t + p.start).toFixed(3), end: +(t + p.end).toFixed(3) }));
  timeline.push(entry);
  t += seconds;
  console.log(`${line.id}: ${seconds.toFixed(2)} s`);
}
writeFileSync(join(out, `${basename(file, '.json')}.timeline.json`), JSON.stringify({ model: play.model, lengthSeconds: +t.toFixed(3), lines: timeline }, null, 1));
console.log(`timeline: ${t.toFixed(2)} s`);
