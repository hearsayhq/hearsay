// Speaks the customer and add-on lines of a Polly play (voice/polly-*.json) with Amazon Polly's
// generative engine through the AWS CLI, then masters them like the narration. Writes
// public/voice/<id>.mp3. Needs AWS credentials with polly:SynthesizeSpeech (about $0.03 per 1000 characters).
//   AWS_PROFILE=<yours> node voice/make-polly.mjs voice/polly-v5.json
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) throw new Error('usage: node voice/make-polly.mjs voice/polly-<name>.json');
const play = JSON.parse(readFileSync(file, 'utf8'));
const MASTER = 'aresample=48000,highpass=f=70,acompressor=threshold=-22dB:ratio=2.5:attack=6:release=90:makeup=2,loudnorm=I=-16:TP=-1.5:LRA=7';
mkdirSync('out/voice-raw', { recursive: true });
for (const line of play.lines) {
  const raw = `out/voice-raw/${line.id}.mp3`;
  execFileSync('aws', ['polly', 'synthesize-speech', '--engine', 'generative', '--voice-id', line.voice, '--output-format', 'mp3', '--sample-rate', '24000', '--text', line.text, raw], { stdio: ['ignore', 'ignore', 'inherit'] });
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-af', MASTER, '-ar', '48000', '-b:a', '192k', `public/voice/${line.id}.mp3`]);
  const s = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', `public/voice/${line.id}.mp3`]).toString());
  console.log(`${line.id} (${line.voice}): ${s.toFixed(2)} s`);
}
