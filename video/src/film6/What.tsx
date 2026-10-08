/**
 * 02 · What it is. "Hearsay catches this." Then what an add-on is: an MCP server, the tools it
 * gives the assistant, the part you write. Then the real console run (a web page whose engine is
 * the MCP client) on the flawed demo build, real time, with a checklist of what it does beside it.
 */
import type { ReactNode } from 'react';
import { CLIPS, sceneFrames } from '../film5/plan';
import { Rec, track } from '../film4/kit';
import type { View } from '../film4/kit';
import { display, mono, P, QIO, serif } from './design';
import { Cam, cueOf, Disc, Draw, Hi, HOME, Label, Place, ramp, Rise, Svg, Target, useF, useInk, Window, Words } from './kit';
import { QIN } from './design';
import { CASE_EXIT } from './Case';
import { narrLoud, useAbs } from './clock';

const w = cueOf('what');
const CON = { x: 96, y: 140, w: 1300, h: 720 };
/** Views of the console recording (3840×2160): the Run button, the runs, the verdict. */
const V_RUN: View = { x: 1900, y: 40, w: 1500 };
const V_RUNS: View = { x: 1120, y: 760, w: 2000 };
const V_VERDICT: View = { x: 640, y: 300, w: 1500 };

function Catches({ out }: { out: number }) {
  const fr = useF();
  const ink = useInk();
  const tk = ramp(fr, 16, 56);
  return (
    <>
      <div style={{ position: 'absolute', left: 960 - 115, top: 170, transform: `scale(${1 - ramp(fr, out, out + 18, 0, 1, QIO)})` }}>
        <Target size={230} k={tk} spin={(1 - tk) * 200} a={ink.fg} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 470, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 36 }}>
        <span style={{ fontFamily: display, fontWeight: 900, fontSize: 150, letterSpacing: '-0.05em', color: ink.fg }}><Rise at={w('what', 0)} out={out}>Hearsay</Rise></span>
        <span style={{ fontFamily: serif, fontSize: 168, color: P.orange }}>
          <Words parts={[['catches', w('what', 1)], ['this.', w('what', 2)]]} gap="0.22em" />
        </span>
      </div>
      <Veil at={out} top={430} h={260} />
    </>
  );
}

/** Wipes a block away upwards, for type that is not in a Rise. */
function Veil({ at, top, h }: { at: number; top: number; h: number }) {
  const fr = useF();
  const ink = useInk();
  const k = ramp(fr, at + 2, at + 22, 0, 1, QIO);
  if (k <= 0) return null;
  return <div style={{ position: 'absolute', left: 0, right: 0, top, height: h, background: ink.bg, clipPath: `inset(${(1 - k) * 100}% 0 0 0)` }} />;
}

const TOOLS = ['add_to_cart', 'review_cart', 'place_order', 'set_budget'];

function Server({ out }: { out: number }) {
  const fr = useF();
  const abs = useAbs();
  const ink = useInk();
  const box = ramp(fr, w('what', 7) - 10, w('what', 7) + 26, 0, 1, QIO);
  const gone = ramp(fr, out, out + 24, 0, 1, QIO);
  if (gone >= 1) return null;
  const pick = w('what', 19);
  return (
    <div style={{ position: 'absolute', inset: 0, transform: `translateX(${gone * -700}px)`, opacity: 1 - gone }}>
      {/* The assistant, on the left, asking. */}
      <Place x={330} y={500} at={w('what', 14) - 20} anchor="c" dy={0}>
        <div style={{ width: 150, height: 150, borderRadius: 75, border: `3px solid ${ink.fg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          {[0.5, 0.8, 1, 0.7, 0.45].map((h, i) => <span key={i} style={{ width: 8, borderRadius: 4, height: 12 + h * 50 * Math.min(1, narrLoud(abs - i * 2) * 1.3 + 0.15), background: ink.fg }} />)}
        </div>
      </Place>
      <Place x={330} y={600} at={w('what', 14) - 12} anchor="tc"><Label>voice assistant</Label></Place>
      <Svg>
        <Draw d="M 420 470 L 690 470" at={w('what', 14)} dur={20} width={2} />
        <Draw d="M 678 461 L 690 470 L 678 479" at={w('what', 14) + 18} dur={6} width={2} />
        <Draw d="M 690 535 L 420 535" at={w('what', 16)} dur={20} width={2} />
        <Draw d="M 432 526 L 420 535 L 432 544" at={w('what', 16) + 18} dur={6} width={2} />
      </Svg>
      <Place x={555} y={436} at={w('what', 14) + 6} anchor="tc"><span style={{ fontFamily: mono, fontSize: 17, color: ink.muted }}>tools/list</span></Place>
      <Place x={555} y={546} at={w('what', 16) + 6} anchor="tc"><span style={{ fontFamily: mono, fontSize: 17, color: ink.muted }}>tools/call</span></Place>

      {/* The server. */}
      <div style={{ position: 'absolute', left: 720, top: 214, width: 860, height: 560, border: `2px solid ${ink.fg}`, background: ink.raise, clipPath: `inset(0 ${(1 - box) * 100}% 0 0)` }}>
        <div style={{ position: 'absolute', left: 44, top: 36 }}>
          <Label><Rise at={w('what', 3)}>an add-on is an</Rise></Label>
          <div style={{ fontFamily: display, fontWeight: 800, fontSize: 92, letterSpacing: '-0.04em', color: ink.fg, marginTop: 6 }}>
            <Words parts={[['MCP', w('what', 7)], ['server', w('what', 8)]]} />
          </div>
          <div style={{ fontFamily: mono, fontSize: 19, color: ink.muted, marginTop: 4 }}>
            <Words parts={[['a', w('what', 9)], ['small', w('what', 10)], ['web', w('what', 11)], ['service', w('what', 12)], ['·', w('what', 12) + 4], ['Streamable HTTP', w('what', 12) + 8], ['·', w('what', 12) + 10], ['spec 2025-11-25', w('what', 12) + 12]]} gap="0.5em" />
          </div>
        </div>
        <div style={{ position: 'absolute', left: 44, right: 44, top: 270 }}>
          {TOOLS.map((t, i) => {
            const at = w('what', 17) + i * 5;
            const on = t === 'add_to_cart' ? ramp(fr, pick, pick + 14, 0, 1, QIO) : 0;
            return (
              <div key={t} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 20, height: 58, borderTop: `1px solid ${ink.hair}`, opacity: ramp(fr, at, at + 10), transform: `translateX(${(1 - ramp(fr, at, at + 22)) * 30}px)` }}>
                <span style={{ position: 'absolute', left: -12, right: -12, top: 6, bottom: 6, background: P.orange, transformOrigin: 'left', transform: `scaleX(${on})` }} />
                <span style={{ position: 'relative', fontFamily: mono, fontSize: 30, color: on > 0.5 ? '#fff' : ink.fg }}>{t}</span>
                <span style={{ position: 'relative', marginLeft: 'auto', fontFamily: mono, fontSize: 15, letterSpacing: '0.12em', color: on > 0.5 ? '#fff' : ink.muted }}>TOOL</span>
              </div>
            );
          })}
        </div>
      </div>
      <Svg>
        <Draw d="M 720 806 L 720 822 L 1580 822 L 1580 806" at={w('what', 22)} dur={24} width={2.5} stroke={P.orange} />
      </Svg>
      <div style={{ position: 'absolute', left: 1150, top: 828, transform: 'translateX(-50%)', fontFamily: serif, fontSize: 58, color: P.orange, whiteSpace: 'nowrap' }}>
        <Words parts={[['the', w('what', 23)], ['part', w('what', 24)], ['you', w('what', 25)], ['write.', w('what', 26)]]} gap="0.24em" />
      </div>
    </div>
  );
}

const STEPS: Array<{ n: string; text: ReactNode; at: number; fail?: boolean }> = [
  { n: '01', text: 'plays what customers say', at: w('what', 28) },
  { n: '02', text: <>as said, and <span style={{ fontFamily: serif, fontWeight: 400, color: P.orange, fontSize: '1.18em' }}>misheard</span></>, at: w('what', 35) },
  { n: '03', text: 'checks every reply', at: w('what', 38) },
  { n: '04', text: 'fails the build', at: w('what', 42), fail: true },
];

function Console() {
  const fr = useF();
  const ink = useInk();
  // The console run, in real time: its "Run suite" click lands on "Hearsay plays".
  const shift = w('what', 28) / 60 - 0.1 - CLIPS.console.run;
  const con = (clipSec: number) => Math.round((shift + clipSec) * 60);
  const t = fr / 60 - shift;
  const enter = con(2.3);
  const D = sceneFrames('what');
  const k = ramp(fr, enter - 6, enter + 30);
  const drop = ramp(fr, D - 36, D - 8, 0, 1, QIN);
  if (k <= 0) return null;
  const view = track(fr, [
    [enter, V_RUN],
    [con(CLIPS.console.runs) - 2, V_RUN],
    [con(CLIPS.console.runs) + 16, V_RUNS],
    [con(CLIPS.console.top) - 2, V_RUNS],
    [con(CLIPS.console.top) + 16, V_VERDICT],
  ]);
  return (
    <>
      <Window x={CON.x} y={CON.y} w={CON.w} h={CON.h} k={k} style={{ transform: `perspective(2600px) translateY(${drop * 900}px) rotateX(${drop * 20}deg)`, opacity: 1 - drop }} title="localhost:5180 — Hearsay’s console, the MCP client" tag="REAL RUN · REAL TIME · FLAWED DEMO BUILD">
        <Rec clip={CLIPS.console} t={t} view={view} vw={CON.w} vh={CON.h}>
          <Hi at={con(CLIPS.console.run) - 4} x={2950} y={150} w={180} h={74} out={con(CLIPS.console.result)} />
          <Hi at={w('what', 37) - 2} x={1600} y={1044} w={330} h={38} out={con(CLIPS.console.top) - 4} />
          <Hi at={w('what', 38) - 2} x={2050} y={1044} w={1050} h={38} color={P.red} out={con(CLIPS.console.top) - 4} />
          <Hi at={w('what', 42) - 2} x={700} y={420} w={320} h={56} color={P.red} />
        </Rec>
      </Window>
      <div style={{ position: 'absolute', left: 1460, top: 200, width: 400 }}>
        <Place x={0} y={0} at={enter + 10} out={D - 34}><Label>what Hearsay does</Label></Place>
        {/* Out: each step becomes an empty box, which the next page carries into its four stations. */}
        {STEPS.map((s, i) => <ExitBox key={s.n} i={i} D={D} />)}
        {STEPS.map((s, i) => {
          const on = ramp(fr, s.at - 4, s.at + 18);
          const tick = ramp(fr, s.at + 6, s.at + 20, 0, 1, QIO);
          const gone = ramp(fr, D - 30, D - 14);
          return (
            <div key={s.n} style={{ position: 'absolute', left: 0, top: 50 + i * 150, width: 400, opacity: (0.25 + 0.75 * on) * (1 - gone), transform: `translateX(${(1 - on) * 24}px)` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: mono, fontSize: 16, color: s.fail ? P.red : ink.muted }}>
                <span style={{ width: 26, height: 26, border: `2px solid ${s.fail ? P.red : ink.fg}`, background: s.fail ? P.red : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.fail ? '#fff' : ink.fg, fontSize: 18, fontWeight: 600 }}>
                  <span style={{ transform: `scale(${tick})` }}>{s.fail ? '✗' : '✓'}</span>
                </span>
                {s.n}
              </div>
              <div style={{ fontFamily: display, fontSize: 44, fontWeight: 650, letterSpacing: '-0.025em', lineHeight: 1.08, color: s.fail ? P.red : ink.fg, marginTop: 12 }}>{s.text}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/** The four boxes the steps leave behind (page coordinates; the camera is home by then). */
export const STEP_BOX = (i: number) => ({ x: 1444, y: 236 + i * 150, w: 432, h: 140 });
function ExitBox({ i, D }: { i: number; D: number }) {
  const fr = useF();
  const ink = useInk();
  const k = ramp(fr, D - 30 + i * 2, D - 14 + i * 2, 0, 1, QIO);
  if (k <= 0) return null;
  const b = STEP_BOX(i);
  return <div style={{ position: 'absolute', left: b.x - 1460, top: b.y - 200, width: b.w, height: b.h, border: `2px solid ${ink.fg}`, clipPath: `inset(0 ${(1 - k) * 100}% 0 0)`, boxSizing: 'border-box' }} />;
}

export function What() {
  const fr = useF();
  const D = sceneFrames('what');
  // In: the orange that flooded the last frame shrinks into the target.
  const inK = ramp(fr, 0, 26, 0, 1, QIO);
  const T = { x: 960, y: 517 + (285 - 517) * 1.06, r: 115 * 1.06 };
  const out = w('what', 3) - 10;
  const consoleIn = Math.round((w('what', 28) / 60 - 0.1 - CLIPS.console.run + 2.3) * 60);
  return (
    <>
      <Cam keys={[[-40, { x: 960, y: 517, s: 1.06 }], [out, HOME], [consoleIn - 20, HOME], [consoleIn + 40, { x: 980, y: 500, s: 1.02 }], [D - 120, { x: 980, y: 500, s: 1.04 }], [D - 50, HOME]]}>
        {fr < out + 30 ? <Catches out={out} /> : null}
        {fr >= out - 10 ? <Server out={consoleIn - 14} /> : null}
        <Console />
      </Cam>
      <Disc x={CASE_EXIT.x + (T.x - CASE_EXIT.x) * inK} y={CASE_EXIT.y + (T.y - CASE_EXIT.y) * inK} r={2300 + (T.r - 2300) * inK} color={P.orange} z={9} opacity={1 - ramp(fr, 26, 40)} />
    </>
  );
}
