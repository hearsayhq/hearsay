/**
 * 01 · The problem. The title: Hearsay, a crash test for voice add-ons, with the narrator's own
 * voice drawn under it. Then the example as a diagram: the customer, the assistant, your add-on;
 * what was said, what was heard ("fifteen" becomes "fifty"), the tool call, the reply, the
 * receipt over budget, and the typed test that never saw any of it.
 */
import { POLLY, pollyAt, sceneFrames } from '../film5/plan';
import { display, mono, P, QIO, serif } from './design';
import type { CSSProperties } from 'react';
import { Cam, cueOf, Disc, Draw, HOME, Label, Place, ramp, Rise, Svg, Target, useF, useInk, Words } from './kit';
import { QIN } from './design';
import { ENV, pollyLoud, useAbs } from './clock';

const w = cueOf('case');

/** The narrator's voice, scrolling: the newest bars on the right, in orange. */
function Scope({ out }: { out: number }) {
  const abs = useAbs();
  const fr = useF();
  const ink = useInk();
  const o = 1 - ramp(fr, out, out + 20);
  const N = 240;
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 64, width: 1792, top: 770, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: o * ramp(fr, 4, 40) }}>
      {Array.from({ length: N }, (_, i) => {
        const v = (ENV.narr[abs - (N - 1 - i)] ?? 0) / 100;
        const hot = i > N - 18;
        return <span key={i} style={{ width: 3, height: Math.max(1.5, v * 120), background: hot ? P.orange : ink.fg, opacity: hot ? 1 : 0.16 + 0.3 * (i / N) }} />;
      })}
    </div>
  );
}

const SPOKEN: CSSProperties = { fontFamily: serif, fontWeight: 400, fontSize: 92, color: P.orange, letterSpacing: '-0.01em' };

function Title() {
  const fr = useF();
  const ink = useInk();
  const hs = w('open', 2);
  const out = w('open', 16) - 2;
  const tk = ramp(fr, hs - 4, hs + 50);
  return (
    <>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 200, display: 'flex', justifyContent: 'center' }}>
        <Label style={{ letterSpacing: '0.3em' }}><Rise at={w('open', 0)} out={out}>this is</Rise></Label>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 236, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 44 }}>
        <div style={{ transform: `scale(${1 - ramp(fr, out, out + 16, 0, 1, QIO)})` }}>
          <Target size={190} k={tk} spin={(1 - tk) * -120} a={ink.fg} />
        </div>
        <div style={{ display: 'flex', fontFamily: display, fontWeight: 900, fontSize: 250, letterSpacing: '-0.05em', lineHeight: 0.9, color: ink.fg }}>
          {'HEARSAY'.split('').map((c, i) => <Rise key={i} at={hs + i * 2} out={out + i} dur={28}>{c}</Rise>)}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 540, display: 'flex', justifyContent: 'center', fontFamily: display, fontSize: 74, fontWeight: 600, letterSpacing: '-0.03em', color: ink.fg }}>
        <Words parts={[
          ['a', w('open', 3)], ['crash', w('open', 4)], ['test', w('open', 5)], ['for', w('open', 6)],
          ['voice', w('open', 7), SPOKEN],
          ['add-ons', w('open', 8)],
        ]} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 646, display: 'flex', justifyContent: 'center', alignItems: 'baseline', fontFamily: display, fontSize: 74, fontWeight: 600, letterSpacing: '-0.03em', color: ink.muted }}>
        <Words parts={[['so', w('open', 9)], ['they', w('open', 10)], ['don’t', w('open', 11)], ['go', w('open', 12)], ['wrong', w('open', 13)]]} />
        <span style={{ width: 22 }} />
        <Words parts={[
          ['out', w('open', 14), { fontFamily: serif, fontWeight: 400, fontSize: 104, color: P.orange }],
          ['loud.', w('open', 15), { fontFamily: serif, fontWeight: 400, fontSize: 104, color: P.orange }],
        ]} />
      </div>
      {/* Everything above leaves together on "Here's an example". */}
      <OutVeil at={out} />
      <Scope out={out} />
    </>
  );
}

/** The title's lines drop out of their masks; this covers what Rise does not (the sentences). */
function OutVeil({ at }: { at: number }) {
  const fr = useF();
  const ink = useInk();
  const k = ramp(fr, at + 4, at + 26, 0, 1, QIO);
  if (k <= 0) return null;
  return <div style={{ position: 'absolute', left: 0, right: 0, top: 520, height: 260, background: ink.bg, clipPath: `inset(${(1 - k) * 100}% 0 0 0)` }} />;
}

/** A person, drawn in two strokes. */
function Person({ x, y, at }: { x: number; y: number; at: number }) {
  return (
    <>
      <Draw d={`M ${x} ${y - 52} m -19 0 a 19 19 0 1 0 38 0 a 19 19 0 1 0 -38 0`} at={at} dur={22} width={3} />
      <Draw d={`M ${x - 40} ${y + 34} C ${x - 40} ${y - 14}, ${x + 40} ${y - 14}, ${x + 40} ${y + 34}`} at={at + 6} dur={22} width={3} />
    </>
  );
}

/** The assistant: a ring with a voice inside that moves when someone speaks. */
function Assistant({ x, y, at }: { x: number; y: number; at: number }) {
  const fr = useF();
  const abs = useAbs();
  const ink = useInk();
  const k = ramp(fr, at, at + 24);
  if (k <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: x - 60, top: y - 60, width: 120, height: 120, borderRadius: 60, border: `3px solid ${ink.fg}`, transform: `scale(${0.6 + 0.4 * k})`, opacity: k, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      {[0.55, 0.85, 1, 0.75, 0.5].map((h, i) => {
        const v = pollyLoud(abs - i * 3) + (ENV.narr[abs] ?? 0) / 600;
        return <span key={i} style={{ width: 7, borderRadius: 4, height: 10 + h * 46 * Math.min(1, v * 1.4 + 0.1), background: pollyLoud(abs) > 0.05 ? P.orange : ink.fg }} />;
      })}
    </div>
  );
}

/** A dot running along a line while someone speaks. */
function Pulse({ x0, x1, y, from, to }: { x0: number; x1: number; y: number; from: number; to: number }) {
  const fr = useF();
  if (fr < from || fr > to + 10) return null;
  const k = ramp(fr, from, to, 0, 1, QIO);
  const x = x0 + (x1 - x0) * k;
  const tail = Math.max(x0, x - 120);
  return (
    <>
      <path d={`M ${tail} ${y} L ${x} ${y}`} stroke={P.orange} strokeWidth={5} strokeLinecap="round" opacity={1 - ramp(fr, to, to + 10)} />
      <circle cx={x} cy={y} r={9} fill={P.orange} opacity={1 - ramp(fr, to, to + 10)} />
    </>
  );
}

/** "fifteen", misheard: the "teen" falls out of the word and "ty" rises in its place. */
function Misheard({ at }: { at: number }) {
  const fr = useF();
  const k = ramp(fr, at, at + 30, 0, 1, QIO);
  const box = ramp(fr, at + 8, at + 26);
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span style={{ position: 'absolute', left: '-0.08em', right: '-0.08em', top: '0.06em', bottom: '-0.02em', background: P.orange, transformOrigin: 'left', transform: `scaleX(${box})` }} />
      <span style={{ position: 'relative', color: box > 0.5 ? '#fff' : 'inherit' }}>fif</span>
      <span style={{ position: 'relative', display: 'inline-block', width: `${2.02 - 1.14 * k}em`, height: '1em', verticalAlign: 'baseline' }}>
        {'teen'.split('').map((c, i) => {
          const d = ramp(fr, at + i * 2, at + i * 2 + 16, 0, 1, (x) => x * x);
          return <span key={i} style={{ position: 'absolute', left: `${[0, 0.36, 0.91, 1.46][i]}em`, bottom: 0, transform: `translateY(${d * 90}%) rotate(${d * (i % 2 ? 24 : -18)}deg)`, opacity: 1 - Math.min(1, d * 1.6) }}>{c}</span>;
        })}
        <span style={{ position: 'absolute', left: 0, bottom: 0, overflow: 'hidden', height: '1.2em' }}>
          <span style={{ display: 'inline-block', transform: `translateY(${(1 - ramp(fr, at + 10, at + 34)) * 110}%)`, color: '#fff' }}>ty</span>
        </span>
      </span>
    </span>
  );
}

function Example() {
  const fr = useF();
  const ink = useInk();
  const said = pollyAt('p5-customer');
  const saidLen = Math.round(POLLY.find((p) => p.id === 'p5-customer')!.seconds * 60);
  const step = saidLen / 5;
  const heard = w('case2', 0);
  const fifty = w('case2', 4);
  const answers = w('case2', 5);
  const reply = pollyAt('p5-flawed');
  const receipt = w('case3', 0);
  const typing = w('case3', 7);
  const never = w('case3', 13);
  const dim = 1 - 0.82 * ramp(fr, typing - 6, typing + 18);
  const Y = 300;
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, opacity: dim }}>
        <Svg>
          <Person x={330} y={Y + 8} at={w('case1', 10)} />
          <Draw d={`M 410 ${Y} L 880 ${Y}`} at={w('case1', 10) + 8} dur={26} width={2} />
          <Draw d={`M 868 ${Y - 9} L 880 ${Y} L 868 ${Y + 9}`} at={w('case1', 10) + 30} dur={8} width={2} />
          <Draw d={`M 1040 ${Y} L 1420 ${Y}`} at={w('case1', 6) + 6} dur={26} width={2} />
          <Draw d={`M 1408 ${Y - 9} L 1420 ${Y} L 1408 ${Y + 9}`} at={w('case1', 6) + 28} dur={8} width={2} />
          <Pulse x0={410} x1={880} y={Y} from={said} to={said + saidLen} />
          <Pulse x0={1040} x1={1420} y={Y} from={answers} to={answers + 34} />
          <Pulse x0={1420} x1={1040} y={Y + 16} from={reply - 20} to={reply + 10} />
        </Svg>
        <Place x={330} y={Y + 70} at={w('case1', 10) + 10} anchor="tc"><Label>customer</Label></Place>
        <Assistant x={960} y={Y} at={w('case1', 6)} />
        <Place x={960} y={Y + 80} at={w('case1', 6) + 8} anchor="tc"><Label>voice assistant</Label></Place>
        <Place x={1440} y={Y - 92} at={w('case1', 3)} dx={40} dy={0}>
          <div style={{ width: 380, padding: '20px 24px 22px', background: ink.raise, border: `1.5px solid ${ink.fg}` }}>
            <Label>your add-on · MCP server</Label>
            <div style={{ fontFamily: display, fontWeight: 800, fontSize: 46, letterSpacing: '-0.03em', color: ink.fg, marginTop: 8 }}>Groceries</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10, fontFamily: mono, fontSize: 15, color: ink.fg }}>
              <span style={{ background: ink.fg, color: ink.bg, padding: '4px 8px' }}>add_to_cart</span>
              <span style={{ padding: '4px 0', color: ink.muted }}>budget $50 a day</span>
            </div>
          </div>
        </Place>
        <Place x={1230} y={Y - 58} at={answers + 6} anchor="tc" dy={10} out={receipt + 40}>
          <div style={{ fontFamily: mono, fontSize: 21, color: ink.fg, background: ink.bg, padding: '4px 10px', border: `1px solid ${ink.hair}` }}>add_to_cart(<span style={{ color: P.orange }}>fruit, $50</span>)</div>
        </Place>

        {/* What was said, and what was heard. */}
        <div style={{ position: 'absolute', left: 150, top: 488, width: 140 }}><Place x={0} y={0} at={said - 10}><Label>said</Label></Place></div>
        <div style={{ position: 'absolute', left: 300, top: 462, fontFamily: display, fontSize: 72, fontWeight: 600, letterSpacing: '-0.03em', color: ink.fg }}>
          <Words parts={[['“Add', said], ['fifteen', said + step], ['dollars', said + step * 2], ['of', said + step * 3], ['fruit.”', said + step * 4]]} gap="0.24em" />
        </div>
        <div style={{ position: 'absolute', left: 150, top: 610, width: 140 }}><Place x={0} y={0} at={heard - 4}><Label color={P.orange}>heard</Label></Place></div>
        <div style={{ position: 'absolute', left: 300, top: 584, fontFamily: display, fontSize: 72, fontWeight: 600, letterSpacing: '-0.03em', color: ink.fg, opacity: ramp(fr, heard - 4, heard + 10), transform: `translateY(${(1 - ramp(fr, heard - 4, heard + 30)) * -122}px)` }}>
          “Add <Misheard at={fifty - 4} /> dollars of fruit.”
        </div>

        {/* The reply, and the receipt it leaves. */}
        <Place x={1440} y={420} at={reply - 4} dy={16}>
          <Label>the add-on says</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 6 }}>
            <span style={{ fontFamily: display, fontWeight: 800, fontSize: 84, letterSpacing: '-0.04em', color: ink.fg }}>“Added.”</span>
          </div>
        </Place>
        <Receipt at={receipt} />
      </div>
      <Typed at={typing} never={never} />
    </>
  );
}

function Receipt({ at }: { at: number }) {
  const fr = useF();
  const ink = useInk();
  const k = ramp(fr, at - 6, at + 30, 0, 1, QIO);
  if (k <= 0) return null;
  const rows: Array<[string, string, number, string?]> = [
    ['milk', '7.40', at + 4],
    ['fruit', '50.00', w('case3', 1), P.orange],
    ['total', '57.40', w('case3', 3)],
    ['budget', '50.00', w('case3', 3) + 8],
    ['over by', '7.40', w('case3', 5), P.red],
  ];
  return (
    <div style={{ position: 'absolute', left: 1440, top: 560, width: 380, height: 330, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, transform: `translateY(${(k - 1) * 100}%)`, background: '#F8F6F0', padding: '22px 26px 30px', fontFamily: mono, fontSize: 21, color: P.ink, boxShadow: '0 20px 40px -20px rgba(40,30,10,0.4)', clipPath: 'polygon(0 0, 100% 0, 100% 94%, 95% 100%, 90% 94%, 85% 100%, 80% 94%, 75% 100%, 70% 94%, 65% 100%, 60% 94%, 55% 100%, 50% 94%, 45% 100%, 40% 94%, 35% 100%, 30% 94%, 25% 100%, 20% 94%, 15% 100%, 10% 94%, 5% 100%, 0 94%)' }}>
        <div style={{ letterSpacing: '0.2em', fontSize: 14, color: P.graphite, marginBottom: 12 }}>CART · TODAY</div>
        {rows.map(([a, b, t, c], i) => (
          <div key={a} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderTop: i === 2 ? `1.5px dashed ${P.graphite}` : 'none', marginTop: i === 2 ? 8 : 0, opacity: ramp(fr, t, t + 6), color: c ?? P.ink, fontWeight: c ? 600 : 400 }}>
            <span>{a}</span><span>${b}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The test that was typed: a chat that types "$15" and gets "Added." back, every time. */
function Typed({ at, never }: { at: number; never: number }) {
  const fr = useF();
  const ink = useInk();
  const k = ramp(fr, at - 8, at + 22, 0, 1);
  if (k <= 0) return null;
  const text = 'Add $15 of fruit';
  const n = Math.round(ramp(fr, at + 8, at + 44, 0, text.length, (x) => x));
  const reply = at + 58;
  return (
    <div style={{ position: 'absolute', left: 560, top: 400, width: 800, transform: `translateY(${(1 - k) * 80}px)`, opacity: k }}>
      <Label dot={P.green}>tested by typing</Label>
      <div style={{ marginTop: 14, padding: '30px 34px', background: ink.raise, border: `1.5px solid ${ink.fg}`, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ alignSelf: 'flex-end', background: ink.fg, color: ink.bg, fontFamily: mono, fontSize: 32, padding: '14px 20px', position: 'relative' }}>
          {text.slice(0, n)}<span style={{ opacity: Math.floor(fr / 15) % 2 && n < text.length ? 0 : 1 }}>{n < text.length ? '▍' : ''}</span>
          <svg width={150} height={90} style={{ position: 'absolute', left: 52, top: -18, overflow: 'visible' }}>
            {fr >= never ? <ellipse cx={74} cy={45} rx={54} ry={34} fill="none" stroke={P.orange} strokeWidth={4} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ramp(fr, never, never + 22, 0, 1, QIO)} transform="rotate(-6 75 45)" /> : null}
          </svg>
        </div>
        <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 16, opacity: ramp(fr, reply, reply + 8) }}>
          <span style={{ fontFamily: mono, fontSize: 32, color: ink.fg, padding: '14px 20px', border: `1.5px solid ${ink.fg}` }}>Added.</span>
          <span style={{ fontFamily: mono, fontSize: 20, color: P.green, opacity: ramp(fr, reply + 10, reply + 18) }}>✓ passes</span>
        </div>
      </div>
      <Place x={0} y={330} at={never + 10}>
        <span style={{ fontFamily: serif, fontSize: 46, color: P.orange }}>typed, “$15” is never misheard.</span>
      </Place>
    </div>
  );
}

export function Case() {
  const fr = useF();
  const heard = w('case2', 0);
  const answers = w('case2', 5);
  const receipt = w('case3', 0);
  const typing = w('case3', 7);
  return (
    <>
      {fr < w('case1', 0) + 30 ? (
        <Cam keys={[[0, { x: 960, y: 517, s: 1.08 }], [w('open', 16), HOME]]}><Title /></Cam>
      ) : null}
      {fr >= w('case1', 0) - 10 ? (
        <Cam keys={[
          [w('case1', 0), { x: 1180, y: 420, s: 1.12 }], [w('case1', 10), HOME],
          [heard - 6, HOME], [heard + 24, { x: 760, y: 560, s: 1.16 }],
          [answers - 10, { x: 760, y: 560, s: 1.16 }], [answers + 30, HOME],
          [receipt - 4, HOME], [receipt + 40, { x: 1100, y: 560, s: 1.05 }],
          [typing - 10, { x: 1100, y: 560, s: 1.05 }], [typing + 30, HOME],
        ]}>
          <Example />
        </Cam>
      ) : null}
      {/* Out: the circle around "$15" floods the frame in orange; the next page shrinks it into the mark. */}
      <Disc x={CASE_EXIT.x} y={CASE_EXIT.y} r={ramp(fr, sceneFrames('case') - 26, sceneFrames('case'), 0, 2300, QIN)} color={P.orange} z={9} />
    </>
  );
}

/** Where the circle around "$15" sits on screen at the end of the scene. */
export const CASE_EXIT = { x: 1105, y: 500 };
