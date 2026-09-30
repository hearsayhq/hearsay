// B-roll stills for the video with OpenAI's image model (Sora's API was shut down on 24 Sep 2026).
// Never product output (docs/09 §Proof of function, rule 6). Needs OPENAI_API_KEY; never on screen.
import { writeFileSync } from 'node:fs';

const shots = {
  'kitchen-evening': 'Photorealistic cinematic still, warm evening kitchen, hands unpacking fruit from a paper grocery bag on a wooden counter, a small unbranded fabric smart speaker with a tiny white status LED on its front beside the bag, no light ring, shallow depth of field, warm practical lights, no logos, no text, no faces, 16:9.',
  'kitchen-day': 'Photorealistic cinematic still, the same kind of wooden kitchen counter in calm cool daylight, groceries neatly arranged, a small unbranded fabric smart speaker with a tiny steady white status LED on its front, no light ring, static composition, no logos, no text, no faces, 16:9.',
};
const only = process.argv.slice(2);
for (const [name, prompt] of Object.entries(shots)) {
  if (only.length && !only.includes(name)) continue;
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-image-2', prompt, size: '1536x1024', quality: 'high', n: 1 }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
  writeFileSync(`public/broll/${name}.png`, Buffer.from(body.data[0].b64_json, 'base64'));
  console.log(name, 'ok', body.usage ? JSON.stringify(body.usage) : '');
}
