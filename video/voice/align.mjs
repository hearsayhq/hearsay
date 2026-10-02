// Word timings for every line of a play, so on-screen words land on the spoken word. Sends each
// mastered mp3 to OpenAI's whisper-1 with word timestamps (about $0.006 a minute) and writes
// public/voice/<id>.words.json. Needs OPENAI_API_KEY in the environment; never on screen.
//   node --env-file=.env voice/align.mjs voice/film-v4.json [--only=v4-cold,v4-prob]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const file = process.argv[2];
const only = (process.argv.find((a) => a.startsWith('--only=')) ?? '').slice(7).split(',').filter(Boolean);
if (!file) throw new Error('usage: node voice/align.mjs voice/<play>.json [--only=ids]');
if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set');
const play = JSON.parse(readFileSync(file, 'utf8'));
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, '');

for (const line of play.lines) {
  const out = `public/voice/${line.id}.words.json`;
  if (only.length ? !only.includes(line.id) : existsSync(out)) continue;
  const form = new FormData();
  form.append('file', new Blob([readFileSync(`public/voice/${line.id}.mp3`)], { type: 'audio/mpeg' }), `${line.id}.mp3`);
  form.append('model', 'whisper-1');
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'word');
  form.append('language', 'en');
  form.append('prompt', line.text);
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: form });
  if (!res.ok) throw new Error(`${line.id}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  const body = await res.json();
  // Script words in order, each with the time of the heard word it matches (greedy, in order).
  const heard = body.words.map((w) => ({ n: norm(w.word), start: w.start, end: w.end }));
  const script = line.text.split(/\s+/).filter(Boolean);
  let j = 0;
  const words = script.map((w) => {
    const n = norm(w);
    let k = j;
    while (k < heard.length && k < j + 4 && heard[k].n !== n) k++;
    if (k < heard.length && heard[k].n === n) { j = k + 1; return { word: w, start: heard[k].start, end: heard[k].end }; }
    return { word: w, start: null, end: null };
  });
  // Fill words the transcript spelled differently from their neighbours.
  for (let i = 0; i < words.length; i++) {
    if (words[i].start !== null) continue;
    const prev = words.slice(0, i).reverse().find((w) => w.start !== null);
    const next = words.slice(i + 1).find((w) => w.start !== null);
    words[i].start = prev ? prev.end : 0;
    words[i].end = next ? next.start : body.duration;
    words[i].guessed = true;
  }
  writeFileSync(out, JSON.stringify({ id: line.id, text: line.text, heard: body.text, duration: body.duration, words }, null, 1));
  const missed = words.filter((w) => w.guessed).map((w) => w.word);
  console.log(`${line.id}: ${words.length} words${missed.length ? `, guessed: ${missed.join(' ')}` : ''}${norm(body.text.replace(/\s/g, '')) === norm(line.text.replace(/\s/g, '')) ? '' : `\n  heard: ${body.text}`}`);
}
