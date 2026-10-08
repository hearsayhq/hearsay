/**
 * 05 · Not just ours. 111 add-ons from this hackathon (docs/16, aggregates only): a grid of 111
 * squares that a scan line sweeps, each taking the colour of its worst finding, a counter that
 * runs with the sweep, and the result.
 */
import { SCAN } from '../film5/Scan';
import { sceneFrames } from '../film5/plan';
import { FIVE } from './Rules';
import { display, mono, P, QIO } from './design';
import { cueOf, Label, Odometer, Place, ramp, Rise, useF, useInk } from './kit';

const w = cueOf('scan');
const COLS = 19;
const SIZE = 52;
const GAP = 10;
const GX = 96;
const GY = 340;

/** The add-on whose square opens into the real run: an error, near the middle of the grid. */
export const PICK = (() => {
  let best = 0;
  let d = 1e9;
  for (let i = 0; i < SCAN.started; i++) {
    if ((i * 37) % SCAN.started >= SCAN.worst.error) continue;
    const dd = Math.hypot((i % COLS) - 9, Math.floor(i / COLS) - 2.5);
    if (dd < d) { d = dd; best = i; }
  }
  return best;
})();
export const PICK_RECT = { x: GX + (PICK % COLS) * (SIZE + GAP), y: GY + Math.floor(PICK / COLS) * (SIZE + GAP), w: SIZE, h: SIZE };

export function Scan() {
  const fr = useF();
  const ink = useInk();
  const start = w('scan', 0) - 6;
  const end = w('scan', 10) + 10;
  const all = w('scan', 11);
  // Worst finding per add-on, in an order that looks like a real sweep: errors spread through.
  const cells = Array.from({ length: SCAN.started }, (_, i) => {
    const e = (i * 37) % SCAN.started;
    return e < SCAN.worst.error ? 'error' : e < SCAN.worst.error + SCAN.worst.clean ? 'clean' : 'warn';
  });
  const gridW = COLS * (SIZE + GAP) - GAP;
  const sweepX = GX + ramp(fr, start, end, 0, gridW + 40, (x) => x);
  const color = { error: P.red, warn: P.orange, clean: P.greenBright } as const;
  const focus = ramp(fr, all, all + 20, 0, 1, QIO);
  const D = sceneFrames('scan');
  const exit = ramp(fr, D - 30, D - 10, 0, 1, QIO);
  return (
    <>
      <div style={{ position: 'absolute', left: GX, top: 120, opacity: 1 - exit }}>
        <Label><Rise at={start}>not just ours · docs/16</Rise></Label>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 28, marginTop: 12 }}>
          <Odometer value={SCAN.started} at={start} dur={end - start} size={150} />
          <div style={{ fontFamily: display, fontSize: 56, fontWeight: 700, letterSpacing: '-0.03em', color: ink.fg, lineHeight: 1, whiteSpace: 'nowrap' }}>
            <Rise at={w('scan', 6)}>other Alexa+ add-ons</Rise>{' '}
            <span style={{ color: ink.muted }}><Rise at={w('scan', 8)}>from this hackathon</Rise></span>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: GX, top: GY, width: gridW, display: 'flex', flexWrap: 'wrap', gap: GAP }}>
        {cells.map((c, i) => {
          const x = (i % COLS) * (SIZE + GAP);
          const y = Math.floor(i / COLS) * (SIZE + GAP);
          const passed = sweepX > GX + x + SIZE / 2;
          // In: the squares ripple out from where the five options were.
          const dist = Math.hypot(GX + x - FIVE.x, GY + y - FIVE.y);
          const pop = ramp(fr, dist / 45 - 4, dist / 45 + 10, 0, 1, QIO);
          const chosen = i === PICK;
          // Errors solid red, warnings an orange outline, clean solid green; on "all but five" the
          // five clean ones step forward.
          const solid = c !== 'warn';
          const lift = c === 'clean' ? focus : 0;
          return <span key={i} style={{ width: SIZE, height: SIZE, background: passed && solid ? color[c] : 'transparent', border: `${passed && !solid ? 5 : 1.5}px solid ${passed ? color[c] : ink.hair}`, opacity: chosen ? 1 : 1 - exit, transform: `scale(${((passed ? 1 : 0.9) + 0.18 * lift) * pop * (chosen ? 1 + 0.3 * exit : 1)})`, boxShadow: lift > 0 ? `0 0 0 ${6 * lift}px ${ink.bg}, 0 0 0 ${9 * lift}px ${P.greenBright}` : 'none', boxSizing: 'border-box', zIndex: c === 'clean' ? 1 : 0 }} />;
        })}
      </div>
      {fr < end + 4 && fr > start ? <div style={{ position: 'absolute', left: sweepX, top: GY - 30, width: 4, height: 6 * (SIZE + GAP) + 50, background: P.orange }} /> : null}
      <div style={{ position: 'absolute', left: 1330, top: GY, width: 520, opacity: 1 - exit }}>
        <Place x={0} y={0} at={all - 4}>
          <div style={{ fontFamily: display, fontSize: 132, fontWeight: 800, letterSpacing: '-0.05em', color: ink.fg, lineHeight: 0.9 }}>106<span style={{ color: ink.muted, fontSize: 70 }}> / 111</span></div>
          <div style={{ fontFamily: display, fontSize: 40, fontWeight: 650, color: ink.fg, marginTop: 12, letterSpacing: '-0.02em' }}>had something to fix</div>
        </Place>
        <Place x={0} y={210} at={all + 14}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: mono, fontSize: 19, color: ink.fg }}>
            <span><span style={{ display: 'inline-block', width: 14, height: 14, background: P.red, marginRight: 12 }} />{SCAN.worst.error} fail a run</span>
            <span><span style={{ display: 'inline-block', width: 14, height: 14, border: `3px solid ${P.orange}`, boxSizing: 'border-box', marginRight: 12 }} />{SCAN.worst.warn} with warnings</span>
            <span><span style={{ display: 'inline-block', width: 14, height: 14, background: P.greenBright, marginRight: 12 }} />{SCAN.worst.clean} clean</span>
            <span style={{ color: ink.muted, marginTop: 8 }}>{SCAN.readAloud} of 25 would read JSON or ids aloud</span>
          </div>
        </Place>
      </div>
      <Place x={GX} y={GY + 6 * (SIZE + GAP) + 40} at={all + 40} out={D - 30}>
        <div style={{ fontFamily: display, fontSize: 40, fontWeight: 650, letterSpacing: '-0.02em', color: ink.fg }}>A green run with every submission: <span style={{ color: P.greenBright }}>less to review by hand.</span></div>
        <div style={{ fontFamily: mono, fontSize: 15, color: ink.muted, marginTop: 10 }}>public repos, pinned, built and run in containers · no network · no keys · no tests written for them</div>
      </Place>
    </>
  );
}
