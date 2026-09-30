// Renders a radio-play JSON (voice/*.json) with OpenAI gpt-4o-mini-tts, masters each line, and
// writes public/voice/<id>.mp3 plus public/voice/<name>.timeline.json (start and end of every
// line), so scenes cut to the audio. Needs OPENAI_API_KEY in the environment; never on screen.
//   node voice/make-dialogue.mjs voice/skit.json
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const file = process.argv[2];
if (!file) throw new Error('usage: node voice/make-dialogue.mjs voice/<play>.json');
if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set');
const play = JSON.parse(readFileSync(file, 'utf8'));
const out = 'public/voice';
const tmp = 'out/voice-raw';
mkdirSync(out, { recursive: true });
mkdirSync(tmp, { recursive: true });
const MASTER = 'aresample=48000,highpass=f=70,equalizer=f=220:t=q:w=1.1:g=-1.5,equalizer=f=3200:t=q:w=1.3:g=1.5,acompressor=threshold=-22dB:ratio=2.5:attack=6:release=90:makeup=2,loudnorm=I=-16:TP=-1.5:LRA=7';

let t = 0;
const timeline = [];
for (const line of play.lines) {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: play.model, voice: line.voice, input: line.text, instructions: line.direction, response_format: 'wav' }),
  });
  if (!res.ok) throw new Error(`${line.id}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  const raw = join(tmp, `${line.id}.wav`);
  writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
  // Trim leading and trailing silence so the gaps in the play are the only pauses.
  const mp3 = join(out, `${line.id}.mp3`);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', raw, '-af', `silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,${MASTER}`, '-c:a', 'libmp3lame', '-b:a', '192k', mp3]);
  const seconds = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3]).toString());
  t += line.gapBeforeMs / 1000;
  timeline.push({ id: line.id, who: line.who, text: line.text, start: +t.toFixed(3), end: +(t + seconds).toFixed(3), src: `voice/${line.id}.mp3` });
  t += seconds;
  console.log(`${line.id}: ${seconds.toFixed(2)} s`);
}
writeFileSync(join(out, `${basename(file, '.json')}.timeline.json`), JSON.stringify({ model: play.model, lengthSeconds: +t.toFixed(3), lines: timeline }, null, 1));
console.log(`timeline: ${t.toFixed(2)} s`);
