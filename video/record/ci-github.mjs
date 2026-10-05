// Real CI, as anyone sees it (docs/09 §Proof of function, rule 3): pull request #27 and its two
// `hearsay / voice` runs on github.com, logged out, captured by Playwright at 2× in dark mode.
// Writes out/ci/<shot>.png and out/ci/shots.json (the page URL, the capture time, and the boxes of
// the lines the film points at, in image pixels).
//   node record/ci-github.mjs   (from video/; needs the network, nothing else)
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const OUT = 'out/ci';
const REPO = 'https://github.com/hearsayhq/hearsay';
// Actions logs need a sign-in even on public repos, so the logged-out pages show which step
// failed; the failing log line itself comes from the gh recording (tapes/ci-pr27-4k.tape).
const SHOTS = [
  { name: 'pr-commits', url: `${REPO}/pull/27/commits`, find: ['Check the budget for counted items only', 'Check the budget for every amount again'] },
  { name: 'red-job', url: `${REPO}/actions/runs/36779993236/job/110107538510`, find: ['Run npm run hearsay -- run suites/household-orders.yaml', 'Run npm run hearsay -- run suites/kitchen.yaml'] },
  { name: 'green-job', url: `${REPO}/actions/runs/36780493038/job/110109224867`, find: ['Run npm run hearsay -- run suites/household-orders.yaml', 'Run npm run hearsay -- run suites/kitchen.yaml'] },
  { name: 'red-run', url: `${REPO}/actions/runs/36779993236`, find: ['Process completed with exit code 1'] },
];
const SCALE = 2;

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: SCALE, colorScheme: 'dark', locale: 'en-US' });
const page = await context.newPage();
const shots = [];
for (const s of SHOTS) {
  await page.goto(s.url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const boxes = {};
  for (const text of s.find) {
    const el = page.getByText(text, { exact: false }).first();
    const b = await el.boundingBox({ timeout: 5000 }).catch(() => null);
    if (b) boxes[text] = { x: Math.round(b.x * SCALE), y: Math.round(b.y * SCALE), w: Math.round(b.width * SCALE), h: Math.round(b.height * SCALE) };
  }
  await page.screenshot({ path: `${OUT}/${s.name}.png` });
  shots.push({ name: s.name, url: page.url(), capturedAt: new Date().toISOString(), width: 1600 * SCALE, height: 900 * SCALE, boxes });
  console.log(s.name, page.url(), JSON.stringify(boxes));
}
writeFileSync(`${OUT}/shots.json`, JSON.stringify(shots, null, 2) + '\n');
await browser.close();
