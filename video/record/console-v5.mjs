// Real console recording for film v5.3 (docs/09 §Proof of function, rule 1): the flawed grocery
// add-on in Hearsay's console, a web page whose engine is the MCP client (initialize, tools/list,
// tools/call over Streamable HTTP). Driven by Playwright at 2× (3840×2160), screenshots in a loop
// with their times, real time and uncut: connect, run the suite, open the runs (said,
// heard, reply, verdict). Writes out/console/console-v5.mp4 and a timeline of what happened when.
//   node record/console-v5.mjs   (from video/; starts the flawed server, the engine and the console)
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const ROOT = new URL('../..', import.meta.url).pathname;
const OUT = 'out/console';
const FRAMES = `${OUT}/frames-v5`;
rmSync(FRAMES, { recursive: true, force: true });
mkdirSync(FRAMES, { recursive: true });

const up = async (url) => { for (let i = 0; i < 120; i++) { try { await fetch(url); return; } catch { await new Promise((r) => setTimeout(r, 500)); } } throw new Error(`${url} did not come up`); };
// The flawed build first, so the engine finds it running and does not start the fixed default.
const procs = [spawn('npm', ['run', 'server:orders'], { cwd: ROOT, stdio: 'ignore', env: { ...process.env, HEARSAY_FIXED: '0' } })];
const events = [];
let t0 = 0;
const mark = (what, extra = {}) => { events.push({ t: (Date.now() - t0) / 1000, what, ...extra }); console.log(((Date.now() - t0) / 1000).toFixed(2), what); };

try {
  await up('http://localhost:4103/mcp');
  procs.push(spawn('npm', ['run', 'hearsay', '--', 'serve'], { cwd: ROOT, stdio: 'ignore' }), spawn('npm', ['run', 'dev:web'], { cwd: ROOT, stdio: 'ignore' }));
  await up('http://localhost:4100/api/suites');
  await up('http://localhost:5180');
  // The installed Chrome, headless: no browser download needed.
  const browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2, colorScheme: 'dark' });
  const page = await context.newPage();
  await page.goto('http://localhost:5180');
  await page.getByRole('checkbox').uncheck().catch(() => undefined);
  await page.getByRole('combobox').selectOption('suites/household-orders.yaml');
  // Screenshots in a loop at the page's 2× pixels (Chrome's screencast only gives 1×): each frame
  // carries the time it was taken and is held until the next one.
  const frames = [];
  let recording = true;
  const loop = (async () => {
    while (recording) {
      const ts = Date.now() / 1000;
      const file = `${FRAMES}/${String(frames.length).padStart(5, '0')}.jpg`;
      await page.screenshot({ path: file, type: 'jpeg', quality: 92 });
      frames.push({ ts, file });
    }
  })();
  t0 = Date.now();
  mark('start');
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: /^(Connect|Reconnect)$/ }).click();
  mark('connect');
  await page.getByText(/protocol \d{4}-\d{2}-\d{2}/).first().waitFor({ timeout: 60000 });
  mark('connected', { header: (await page.getByText(/protocol \d{4}-\d{2}-\d{2}/).first().textContent()) ?? '' });
  await page.waitForTimeout(1500);
  // Paced to the narration (v5-what): the run starts on "Hearsay plays", the runs open on "as said
  // and misheard", the verdict comes back into view on "and fails the build".
  const said = 2100;
  const fails = 4600;
  const runAt = Date.now();
  const until = (ms) => page.waitForTimeout(Math.max(0, runAt + ms - Date.now()));
  await page.getByRole('button', { name: 'Run suite' }).click();
  mark('run');
  await page.getByText(/CI would (fail|pass)/).first().waitFor({ timeout: 120000 });
  mark('result', { verdict: (await page.getByText(/CI would (fail|pass)/).first().textContent()) ?? '' });
  await until(said);
  await page.getByText(/^Runs: cases and their misheard variants/).click();
  await page.getByText('asr.number_confusion#1').first().evaluate((e) => e.scrollIntoView({ block: 'center' }));
  mark('runs');
  await until(fails);
  await page.evaluate(() => window.scrollTo(0, 0));
  mark('top');
  await page.waitForTimeout(3300);
  mark('end');
  recording = false;
  await loop;
  const endEpoch = Date.now() / 1000;
  await browser.close();

  // Hold each screenshot until the next, then encode at 60 fps.
  const lines = [];
  for (let i = 0; i < frames.length; i++) {
    const next = frames[i + 1]?.ts ?? endEpoch;
    lines.push(`file '${frames[i].file.replace(`${OUT}/`, '')}'`, `duration ${Math.max(next - frames[i].ts, 0.001).toFixed(4)}`);
  }
  lines.push(`file '${frames.at(-1).file.replace(`${OUT}/`, '')}'`);
  writeFileSync(`${OUT}/frames-v5.txt`, lines.join('\n') + '\n');
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', `${OUT}/frames-v5.txt`, '-t', (endEpoch - frames[0].ts).toFixed(3), '-vf', 'fps=60,format=yuv420p', '-c:v', 'libx264', '-crf', '14', '-preset', 'slow', `${OUT}/console-v5.mp4`]);
  // Screencast time starts at the first frame; events start at t0.
  writeFileSync(`${OUT}/console-v5.timeline.json`, JSON.stringify({ firstFrameEpoch: frames[0].ts, t0Epoch: t0 / 1000, events }, null, 1));
  console.log(`frames: ${frames.length}`);
} finally {
  for (const p of procs) p.kill();
  try { execFileSync('pkill', ['-f', 'servers/household-orders/src/index.ts']); } catch {}
  try { execFileSync('pkill', ['-f', 'packages/cli/src/index.ts serve']); } catch {}
}
