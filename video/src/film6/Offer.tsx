/**
 * 09 · Try it. Three hard cuts, one fact each (open source, on npm, no keys); then Hearsay from npm
 * in an add-on's own project (real run) beside the three steps; then the window folds into the
 * mark, and the end card.
 */
import type { ReactNode } from 'react';
import { CLIPS, CLIP_AT } from '../film5/plan';
import { Rec } from '../film4/kit';
import { display, mono, P, QIO, serif } from './design';
import { cueOf, Hi, Label, ramp, Rise, sec, Target, useF, useInk, Window, Words } from './kit';

const w = cueOf('offer');

function Card({ from, to, bg, fg, children }: { from: number; to: number; bg: string; fg: string; children: ReactNode }) {
  const fr = useF();
  if (fr < from || fr >= to) return null;
  const k = ramp(fr, from, from + 16);
  return (
    <div style={{ position: 'absolute', inset: 0, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6 }}>
      <div style={{ fontFamily: display, fontSize: 210, fontWeight: 850, letterSpacing: '-0.055em', color: fg, transform: `scale(${1.06 - 0.06 * k})`, lineHeight: 0.95, textAlign: 'center' }}>{children}</div>
    </div>
  );
}

const STEPS = [
  { n: '01', t: 'write what your customers say', at: () => w('try', 11) },
  { n: '02', t: 'run one command', at: () => w('try', 16) },
  { n: '03', t: 'put it in your build', at: () => w('try', 19) },
];

export function Offer() {
  const fr = useF();
  const ink = useInk();
  const start = sec(CLIP_AT.npx);
  const t = fr / 60 - CLIP_AT.npx;
  const caseAt = start + sec(CLIPS.npx.case);
  const outAt = start + sec(CLIPS.npx.output);
  const tag = w('tag', 0);
  const page = w('try', 11) - 8;
  const fold = ramp(fr, tag - 30, tag + 4, 0, 1, QIO);
  // The window folds into the mark: it shrinks to a circle at the centre.
  const WX = 96;
  const WY = 150;
  const WW = 1100;
  const WH = 680;
  const cx = LOCK.cx;
  const cy = LOCK.cy;
  const size = LOCKUP.size;
  const x = WX + (cx - size / 2 - WX) * fold;
  const y = WY + (cy - size / 2 - WY) * fold;
  const ww = WW + (size - WW) * fold;
  const hh = WH + 38 + (size - WH - 38) * fold;
  return (
    <>
      {fr < tag + 6 ? (
        <>
          <div style={{ position: 'absolute', left: x, top: y, width: ww, height: hh, borderRadius: `${Math.min(50, 1 + fold * 60)}%`, overflow: 'hidden', background: fold > 0.6 ? ink.fg : 'transparent' }}>
            <div style={{ opacity: 1 - ramp(fr, tag - 30, tag - 14) }}>
              <Window x={0} y={0} w={WW} h={WH} k={ramp(fr, page - 10, page + 26)} ry={5} rx={2} title="your add-on’s project · Hearsay from npm" tag="REAL RUN · REAL TIME">
                <Rec clip={CLIPS.npx} t={t} view={{ x: 0, y: 0, w: 2700 }} vw={WW} vh={WH}>
                  <Hi at={caseAt + 10} x={150} y={170} w={1100} h={46} />
                  <Hi at={outAt - 30} x={60} y={400} w={1560} h={50} />
                  <Hi at={outAt + 10} x={60} y={682} w={1300} h={50} color={P.green} />
                </Rec>
              </Window>
            </div>
          </div>
          <div style={{ position: 'absolute', left: 1270, top: 170, width: 560, opacity: 1 - fold }}>
            <Label>three steps</Label>
            {STEPS.map((s, i) => {
              const at = s.at();
              const k = ramp(fr, at - 4, at + 20, 0, 1, QIO);
              return (
                <div key={s.n} style={{ marginTop: i ? 34 : 26, paddingTop: 18, borderTop: `2px solid ${ink.fg}`, opacity: 0.2 + 0.8 * k, transform: `translateX(${(1 - k) * 30}px)` }}>
                  <div style={{ fontFamily: mono, fontSize: 16, color: k > 0.5 ? P.orange : ink.muted }}>{s.n}</div>
                  <div style={{ fontFamily: display, fontSize: 50, fontWeight: 750, letterSpacing: '-0.03em', lineHeight: 1.05, color: ink.fg, marginTop: 8 }}>{s.t}</div>
                </div>
              );
            })}
            <div style={{ marginTop: 34, fontFamily: mono, fontSize: 20, color: ink.fg, background: ink.raise, padding: '14px 18px', opacity: ramp(fr, w('try', 20), w('try', 20) + 12) }}>- run: npx -y @hearsayhq/cli run suites/*.yaml</div>
          </div>
        </>
      ) : null}
      <Card from={0} to={w('try', 2) - 2} bg={P.paper} fg={P.ink}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 50 }}><Target size={190} k={ramp(fr, 0, 30)} spin={(1 - ramp(fr, 0, 30)) * 120} a={P.ink} /><Rise at={w('try', 0) - 4}>Hearsay</Rise></span></Card>
      <Card from={w('try', 2) - 2} to={w('try', 5) - 2} bg={P.paper} fg={P.ink}>Open source.</Card>
      <Card from={w('try', 5) - 2} to={w('try', 7) - 2} bg={P.orange} fg="#fff">On npm.</Card>
      <Card from={w('try', 7) - 2} to={page} bg={P.ink} fg={P.paper}>No keys.<br /><span style={{ fontFamily: serif, fontWeight: 400, color: P.orange, letterSpacing: '-0.02em' }}>No account.</span></Card>
      <EndCard at={tag} />
    </>
  );
}

/**
 * The end card's lockup: the mark and the wordmark in one line, centred as one (the same lockup as
 * the opening title). HEARSAY at 200 px is about 908 px wide; the mark's centre follows from that,
 * and the folding window lands on it.
 */
const LOCKUP = { size: 190, gap: 44, word: 908, top: 330 } as const;
const LOCKUP_LEFT = 960 - (LOCKUP.size + LOCKUP.gap + LOCKUP.word) / 2;
const LOCK = { cx: LOCKUP_LEFT + LOCKUP.size / 2, cy: LOCKUP.top + LOCKUP.size / 2 };

function EndCard({ at }: { at: number }) {
  const fr = useF();
  const ink = useInk();
  if (fr < at - 2) return null;
  const tk = ramp(fr, at - 2, at + 40);
  return (
    <>
      <div style={{ position: 'absolute', left: 0, right: 0, top: LOCKUP.top, height: LOCKUP.size, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: LOCKUP.gap }}>
        <Target size={LOCKUP.size} k={tk} spin={(1 - tk) * 140} a={ink.fg} />
        <div style={{ display: 'flex', fontFamily: display, fontWeight: 900, fontSize: 200, letterSpacing: '-0.05em', lineHeight: 0.9, color: ink.fg }}>
          {'HEARSAY'.split('').map((c, i) => <Rise key={i} at={at + 4 + i * 2} dur={26}>{c}</Rise>)}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 590, display: 'flex', justifyContent: 'center', fontFamily: serif, fontSize: 80, color: P.orange }}>
        <Words parts={[['Hear', w('tag', 1)], ['it', w('tag', 2)], ['before', w('tag', 3)], ['your', w('tag', 4)], ['customers', w('tag', 5)], ['do.', w('tag', 6)]]} gap="0.22em" />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 730, display: 'flex', justifyContent: 'center', gap: 18, fontFamily: mono, fontSize: 24, opacity: ramp(fr, w('tag', 6) + 10, w('tag', 6) + 26) }}>
        <span style={{ background: ink.fg, color: ink.bg, padding: '10px 18px' }}>github.com/hearsayhq/hearsay</span>
        <span style={{ border: `2px solid ${ink.fg}`, color: ink.fg, padding: '8px 16px' }}>npx @hearsayhq/cli</span>
        <span style={{ border: `2px solid ${ink.fg}`, color: ink.fg, padding: '8px 16px' }}>agents: npx @hearsayhq/mcp</span>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 820, textAlign: 'center', fontFamily: mono, fontSize: 15, letterSpacing: '0.14em', color: ink.muted, opacity: ramp(fr, w('tag', 6) + 24, w('tag', 6) + 40) }}>
        OPEN SOURCE · MIT · PREFLIGHT CHECKS FOR ALEXA+ ADD-ONS · UNOFFICIAL, NOT AFFILIATED WITH AMAZON
      </div>
    </>
  );
}
