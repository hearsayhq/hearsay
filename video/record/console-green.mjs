// Real console recording (docs/09 §Proof of function, rule 1): the fixed grocery add-on in the
// Hearsay console, driven by Playwright, frames straight from Chromium (CDP screencast). Writes
// out/console/console-green.mp4 and a timeline of what happened when, for placing the voices.
//   node record/console-green.mjs   (from video/; starts the engine and the console itself)
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const ROOT = new URL('../..', import.meta.url).pathname;
const OUT = 'out/console';
// Pauses as long as the spoken lines (voice/film-v3.json), so voices and the real recording line up uncut.
const voice = Object.fromEntries(JSON.parse(readFileSync('public/voice/film-v3.timeline.json', 'utf8')).lines.map((l) => [l.id, (l.end - l.start) * 1000]));
const hold = (id, extra = 400) => Math.round(voice[id] + extra);
const FRAMES = `${OUT}/frames`;
rmSync(OUT, { recursive: true, force: true });
mkdirSync(FRAMES, { recursive: true });

const up = async (url) => { for (let i = 0; i < 120; i++) { try { await fetch(url); return; } catch { await new Promise((r) => setTimeout(r, 500)); } } throw new Error(`${url} did not come up`); };
const procs = [spawn('npm', ['run', 'hearsay', '--', 'serve'], { cwd: ROOT, stdio: 'ignore' }), spawn('npm', ['run', 'dev:web'], { cwd: ROOT, stdio: 'ignore' })];
const events = [];
let t0 = 0;
const mark = (what, extra = {}) => { events.push({ t: (Date.now() - t0) / 1000, what, ...extra }); console.log(((Date.now() - t0) / 1000).toFixed(2), what); };

try {
  await up('http://localhost:4100/api/suites');
  await up('http://localhost:5180');
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, colorScheme: 'dark' });
  const page = await context.newPage();
  await page.goto('http://localhost:5180');
  await page.getByRole('checkbox').uncheck().catch(() => undefined);
  const cdp = await context.newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    frames.push({ ts: metadata.timestamp, file: `${FRAMES}/${String(frames.length).padStart(5, '0')}.jpg` });
    writeFileSync(frames.at(-1).file, Buffer.from(data, 'base64'));
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => undefined);
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
  t0 = Date.now();
  mark('start');
  await page.waitForTimeout(800);
  await page.getByRole('combobox').selectOption('suites/household-orders.yaml');
  await page.getByRole('button', { name: /^(Connect|Reconnect)$/ }).click();
  const input = page.getByLabel('What the person says');
  await input.waitFor({ state: 'visible', timeout: 60000 });
  await page.waitForFunction(() => !document.querySelector('input[aria-label="What the person says"]')?.hasAttribute('disabled'));
  mark('connected');
  await page.waitForTimeout(1200);
  const turns = () => page.locator('.turn').count();
  const say = async (text, id) => {
    const before = await turns();
    await input.click();
    mark('type', { id, text });
    await input.pressSequentially(text, { delay: 32 });
    await page.waitForTimeout(250);
    mark('say', { id, text });
    await page.getByRole('button', { name: 'Say' }).click();
    return before;
  };
  const replied = async (before, id) => {
    await page.waitForFunction((n) => document.querySelectorAll('.turn').length > n && !document.querySelector('button[type=submit]')?.textContent?.includes('Playing'), before, { timeout: 60000 });
    mark('reply', { id, spoken: (await page.locator('.turn').last().locator('.spoken').textContent()) ?? '' });
  };
  const answer = async (label, id, holdMs) => {
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ timeout: 60000 });
    mark('dialog', { id, message: (await dialog.locator('.modal-message').textContent()) ?? '' });
    await page.waitForTimeout(holdMs);
    await dialog.getByRole('button', { name: label, exact: true }).click();
    mark('answered', { id, label });
  };

  let b = await say('you can reorder groceries up to forty dollars today', 'grant');
  await answer('Yes', 'grant', 3200);
  await replied(b, 'grant');
  await page.waitForTimeout(1400);
  b = await say('add fifty dollars of fruit', 'fruit');
  await replied(b, 'fruit');
  await page.waitForTimeout(hold('v3-g-a1'));
  b = await say('add two cartons of milk', 'milk');
  await replied(b, 'milk');
  await page.waitForTimeout(hold('v3-g-a2'));
  b = await say('place the order', 'order');
  await answer('No', 'order', hold('v3-g-a3') + hold('v3-g-c6', 0));
  await replied(b, 'order');
  await page.waitForTimeout(hold('v3-g-a4') + hold('v3-g1', 300));
  mark('end');
  const endEpoch = Date.now() / 1000;
  await cdp.send('Page.stopScreencast');
  await browser.close();

  // Frames arrive when the page changes; hold each until the next, then encode at 30 fps.
  const lines = [];
  for (let i = 0; i < frames.length; i++) {
    const next = frames[i + 1]?.ts ?? endEpoch;
    lines.push(`file '${frames[i].file.replace(`${OUT}/`, '')}'`, `duration ${Math.max(next - frames[i].ts, 0.001).toFixed(4)}`);
  }
  lines.push(`file '${frames.at(-1).file.replace(`${OUT}/`, '')}'`);
  writeFileSync(`${OUT}/frames.txt`, lines.join('\n') + '\n');
  // The concat demuxer shows the repeated last frame once more; cut at the logged end of the take.
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', `${OUT}/frames.txt`, '-t', (endEpoch - frames[0].ts).toFixed(3), '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-crf', '16', `${OUT}/console-green.mp4`]);
  // Screencast time starts at the first frame; events start at t0. Record the offset for placing voices.
  writeFileSync(`${OUT}/console-green.timeline.json`, JSON.stringify({ firstFrameEpoch: frames[0].ts, t0Epoch: t0 / 1000, events }, null, 1));
  console.log(`frames: ${frames.length}`);
} finally {
  for (const p of procs) p.kill();
  try { execFileSync('pkill', ['-f', 'servers/household-orders/src/index.ts']); } catch {}
}
