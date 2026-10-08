/**
 * 03 · How it works. What the assistant does, as four stations that light up as they are said;
 * then Hearsay taking over the first three from your test (the real misheard-amount case of
 * suites/household-orders.yaml) and checking the fourth, your server's reply. Then why it fits in
 * a build: no keys, the same result every time, every change.
 */
import type { ReactNode } from 'react';
import { sceneFrames } from '../film5/plan';
import { display, mono, P, QIN, QIO, serif } from './design';
import { Cam, cueOf, Disc, Draw, HOME, Label, Morph, Odometer, Place, ramp, Rise, Svg, useF, useInk, Words } from './kit';
import { STEP_BOX } from './What';

const w = cueOf('how');
const ST = { y: 190, h: 360, w: 380, xs: [96, 536, 976, 1416] } as const;

function Icon({ i, lit }: { i: number; lit: boolean }) {
  const ink = useInk();
  const c = lit ? ink.bg : ink.fg;
  const o = lit ? P.orange : P.orange;
  if (i === 0) return (
    <svg width={140} height={90}>{[18, 40, 64, 30, 52, 22, 12].map((h, k) => <rect key={k} x={8 + k * 19} y={45 - h / 2} width={9} height={h} fill={k === 2 ? o : c} />)}</svg>
  );
  if (i === 1) return (
    <svg width={140} height={90}>{[0, 1, 2].map((k) => <rect key={k} x={10} y={8 + k * 28} width={k === 1 ? 120 : 90} height={16} fill={k === 1 ? o : 'none'} stroke={k === 1 ? o : c} strokeWidth={2.5} />)}</svg>
  );
  if (i === 2) return (
    <svg width={140} height={90}><path d="M 6 45 L 62 45 M 50 34 L 62 45 L 50 56" stroke={o} strokeWidth={3} fill="none" /><rect x={72} y={8} width={60} height={74} fill="none" stroke={c} strokeWidth={2.5} />{[0, 1, 2].map((k) => <line key={k} x1={82} x2={122} y1={26 + k * 18} y2={26 + k * 18} stroke={c} strokeWidth={2.5} />)}</svg>
  );
  return (
    <svg width={140} height={90}><path d="M 10 10 H 130 V 62 H 52 L 32 82 V 62 H 10 Z" fill="none" stroke={c} strokeWidth={2.5} /><line x1={26} x2={110} y1={28} y2={28} stroke={o} strokeWidth={3} /><line x1={26} x2={90} y1={44} y2={44} stroke={c} strokeWidth={3} /></svg>
  );
}

const STATIONS = [
  { verb: 'listens', at: w('how1', 2) },
  { verb: 'picks a tool', at: w('how1', 3) },
  { verb: 'calls your server', at: w('how1', 6) },
  { verb: 'answers', at: w('how1', 10) },
];

function Station({ i, children, title }: { i: number; children?: ReactNode; title?: string }) {
  const fr = useF();
  const ink = useInk();
  const s = STATIONS[i]!;
  const k = ramp(fr, s.at - 18, s.at + 10);
  const next = STATIONS[i + 1]?.at ?? w('how1', 14) + 24;
  const lit = fr >= s.at - 2 && fr < next - 2;
  const x = ST.xs[i]!;
  return (
    <div style={{ position: 'absolute', left: x, top: ST.y, width: ST.w, height: ST.h, border: `2px solid ${ink.fg}`, background: lit ? ink.fg : ink.raise, opacity: k, transform: `translateY(${(1 - k) * 30}px)`, transition: 'none' }}>
      <div style={{ position: 'absolute', left: 26, top: 22, fontFamily: mono, fontSize: 16, letterSpacing: '0.14em', color: lit ? ink.bg : ink.muted }}>0{i + 1}</div>
      <div style={{ position: 'absolute', right: 22, top: 18 }}><Icon i={i} lit={lit} /></div>
      <div style={{ position: 'absolute', left: 26, top: 120, right: 26, fontFamily: display, fontSize: 46, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.02, color: lit ? ink.bg : ink.fg }}>{title ?? s.verb}</div>
      <div style={{ position: 'absolute', left: 26, right: 26, bottom: 24 }}>{children}</div>
    </div>
  );
}

const YAML: Array<{ text: ReactNode; key: string }> = [
  { key: 'id', text: <>- id: misheard-amount</> },
  { key: 'say', text: <>  say: <b>add fifteen dollars of fruit</b></> },
  { key: 'call', text: <>  call: {'{'} tool: <b>orders_stage_cart</b>, args: {'{'} amountUsd: <b>15</b> {'}'} {'}'}</> },
  { key: 'fuzz', text: <>  fuzz: [<b>asr.number_confusion</b>]</> },
];

function Pipeline({ out }: { out: number }) {
  const fr = useF();
  const ink = useInk();
  const hs = w('how2', 0);
  const test = w('how2', 6);
  const words = w('how2', 9);
  const mis = w('how2', 11);
  const call = w('how2', 14);
  const checks = w('how2', 20);
  const frame = ramp(fr, hs - 4, hs + 30, 0, 1, QIO);
  const gone = ramp(fr, out, out + 26, 0, 1, QIO);
  if (gone >= 1) return null;
  const hl: Record<string, number> = { say: words, fuzz: mis, call };
  const hot = (key: string) => (hl[key] !== undefined ? ramp(fr, hl[key]!, hl[key]! + 12) : 0);
  return (
    <div style={{ position: 'absolute', inset: 0, transform: `translateY(${gone * -900}px)` }}>
      <Svg>
        {[0, 1, 2].map((i) => {
          const x0 = ST.xs[i]! + ST.w;
          const x1 = ST.xs[i + 1]!;
          return <Draw key={i} d={`M ${x0 + 8} ${ST.y + ST.h / 2} L ${x1 - 8} ${ST.y + ST.h / 2}`} at={STATIONS[i + 1]!.at - 16} dur={14} width={2.5} />;
        })}
      </Svg>
      <Station i={0}>
        {fr >= words ? (
          <div style={{ fontFamily: mono, fontSize: 19, lineHeight: 1.4, color: ink.fg }}>
            <div style={{ opacity: ramp(fr, words, words + 10) }}>“add fifteen dollars of fruit”</div>
            <div style={{ opacity: ramp(fr, mis, mis + 10), color: P.orange }}>heard: “add <b>fifty</b> dollars …”</div>
          </div>
        ) : null}
      </Station>
      <Station i={1}>{fr >= call ? <div style={{ fontFamily: mono, fontSize: 19, color: ink.fg, opacity: ramp(fr, call, call + 10) }}>orders_stage_cart</div> : null}</Station>
      <Station i={2}>{fr >= call ? <div style={{ fontFamily: mono, fontSize: 19, color: ink.fg, opacity: ramp(fr, call + 6, call + 16) }}>amountUsd: 15 expected</div> : null}</Station>
      <Station i={3} title={fr >= checks - 10 ? 'your server’s reply' : undefined}>
        {fr >= checks ? (
          <div style={{ fontFamily: mono, fontSize: 18, lineHeight: 1.55, color: ink.fg }}>
            {[['✓', 'under half a second', P.green, 0], ['✓', 'no code read aloud', P.green, 8], ['✗', 'took 50, never said it', P.red, 16]].map(([m, t, c, d]) => (
              <div key={t as string} style={{ opacity: ramp(fr, checks + (d as number), checks + (d as number) + 8) }}><span style={{ color: c as string, fontWeight: 600 }}>{m}</span> {t}</div>
            ))}
          </div>
        ) : null}
      </Station>
      {/* Hearsay takes the assistant's part: a frame over the first three stations. */}
      {frame > 0 ? (
        <>
          <div style={{ position: 'absolute', left: ST.xs[0]! - 20, top: ST.y - 20, width: ST.xs[2]! + ST.w - ST.xs[0]! + 40, height: ST.h + 40, border: `5px solid ${P.orange}`, clipPath: `inset(0 ${(1 - frame) * 100}% 0 0)` }} />
          <div style={{ position: 'absolute', left: ST.xs[0]! - 20, top: ST.y - 58, background: P.orange, color: '#fff', fontFamily: mono, fontSize: 17, fontWeight: 600, letterSpacing: '0.14em', padding: '8px 14px', clipPath: `inset(0 ${(1 - frame) * 100}% 0 0)` }}>HEARSAY PLAYS THE ASSISTANT’S PART</div>
        </>
      ) : null}
      {/* The test it plays from: the real case. */}
      {fr >= test - 6 ? (
        <div style={{ position: 'absolute', left: ST.xs[0], top: 640, width: 1210, opacity: ramp(fr, test - 6, test + 14), transform: `translateY(${(1 - ramp(fr, test - 6, test + 24)) * 40}px)` }}>
          <Label dot={P.orange}>your test · suites/household-orders.yaml</Label>
          <div style={{ marginTop: 12, background: '#121211', padding: '20px 26px', fontFamily: mono, fontSize: 24, lineHeight: 1.62, color: '#CFCAC0', whiteSpace: 'pre' }}>
            {YAML.map((l) => (
              <div key={l.key} style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: -10, right: -10, top: 2, bottom: 2, background: 'rgba(255,77,18,0.28)', borderLeft: `4px solid ${P.orange}`, transformOrigin: 'left', transform: `scaleX(${hot(l.key)})` }} />
                <span style={{ position: 'relative' }}>{l.text}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <Place x={1416} y={652} at={checks + 4} dy={14}>
        <div style={{ width: 380, fontFamily: serif, fontSize: 50, lineHeight: 1.05, color: P.orange }}>then it checks what your server says back</div>
      </Place>
    </div>
  );
}

function Why({ from }: { from: number }) {
  const fr = useF();
  const ink = useInk();
  const keys = w('how3', 0);
  const same = w('how3', 5);
  const change = w('how3', 12);
  const col = (x: number, at: number, children: ReactNode) => (
    <div style={{ position: 'absolute', left: x, top: 170, width: 560, height: 700, borderLeft: `2px solid ${ink.fg}`, paddingLeft: 36, opacity: ramp(fr, at - 14, at + 6), transform: `translateY(${(1 - ramp(fr, at - 14, at + 24)) * 50}px)` }}>{children}</div>
  );
  if (fr < from - 20) return null;
  return (
    <>
      {col(96, keys, (
        <>
          <Label>01 · in your build</Label>
          <div style={{ marginTop: 30 }}><Odometer value={0} at={keys} size={300} pad={1} /></div>
          <div style={{ fontFamily: display, fontSize: 64, fontWeight: 800, letterSpacing: '-0.035em', color: ink.fg, marginTop: 8 }}><Rise at={keys + 4}>API keys</Rise></div>
          <div style={{ fontFamily: mono, fontSize: 19, color: ink.muted, marginTop: 18, lineHeight: 1.6 }}>no microphone<br />no model<br />no network</div>
        </>
      ))}
      {col(696, same, (
        <>
          <Label>02 · deterministic</Label>
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[0, 1, 2].map((i) => {
              const at = same + 6 + i * 9;
              return (
                <div key={i} style={{ display: 'flex', gap: 18, alignItems: 'center', fontFamily: mono, fontSize: 24, color: ink.fg, opacity: ramp(fr, at, at + 6), transform: `translateX(${(1 - ramp(fr, at, at + 18)) * -30}px)` }}>
                  <span style={{ color: ink.muted }}>run {i + 1}</span>
                  <span style={{ background: ink.fg, color: ink.bg, padding: '6px 12px' }}>20 errors · seed 1</span>
                  {i > 0 ? <span style={{ color: P.orange, fontWeight: 600 }}>=</span> : null}
                </div>
              );
            })}
          </div>
          <div style={{ fontFamily: display, fontSize: 64, fontWeight: 800, letterSpacing: '-0.035em', color: ink.fg, marginTop: 60, lineHeight: 1 }}>
            <Words parts={[['same', same], ['result', w('how3', 6)]]} />
          </div>
          <div style={{ fontFamily: serif, fontSize: 76, color: P.orange, lineHeight: 1.1 }}><Words parts={[['every', w('how3', 7)], ['time', w('how3', 8)]]} /></div>
        </>
      ))}
      {col(1296, change, (
        <>
          <Label>03 · continuous</Label>
          <svg width={520} height={200} style={{ marginTop: 40, overflow: 'visible' }}>
            <line x1={10} x2={10 + 480 * ramp(fr, change - 10, change + 40, 0, 1, QIO)} y1={100} y2={100} stroke={ink.fg} strokeWidth={3} />
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const at = change - 6 + i * 7;
              const k = ramp(fr, at, at + 12);
              const bad = i === 3;
              return (
                <g key={i} opacity={k}>
                  <circle cx={30 + i * 88} cy={100} r={16 * k} fill={ink.bg} stroke={ink.fg} strokeWidth={3} />
                  <text x={30 + i * 88} y={60} textAnchor="middle" fontFamily={mono} fontSize={26} fontWeight={600} fill={bad ? P.red : P.green}>{bad ? '✗' : '✓'}</text>
                </g>
              );
            })}
          </svg>
          <div style={{ fontFamily: display, fontSize: 64, fontWeight: 800, letterSpacing: '-0.035em', color: ink.fg, lineHeight: 1 }}>
            <Words parts={[['on', w('how3', 13)], ['every', w('how3', 14)]]} />
          </div>
          <div style={{ fontFamily: serif, fontSize: 76, color: P.orange, lineHeight: 1.1 }}><Rise at={w('how3', 15)}>change</Rise></div>
        </>
      ))}
    </>
  );
}

/** Where the camera dives at the end: the counter of the big "0". */
const ZERO = { x: 227, y: 368 };

export function How() {
  const fr = useF();
  const ink = useInk();
  const out = w('how3', 0) - 26;
  const D = sceneFrames('how');
  // Where the "0" is on screen while the camera dives (the same move as the Cam below).
  const dk = QIO(Math.max(0, Math.min(1, (fr - (D - 40)) / 40)));
  const ds = Math.exp(Math.log(7) * dk);
  const dive = { x: 960 + (ZERO.x - (960 + (ZERO.x - 960) * dk)) * ds, y: 517 + (ZERO.y - (517 + (ZERO.y - 517) * dk)) * ds };
  return (
    <>
      {/* In: the four boxes the last page's steps left behind fly into the four stations. */}
      {[0, 1, 2, 3].map((i) => (
        <Morph key={i} from={STEP_BOX(i)} to={{ x: ST.xs[i]!, y: ST.y, w: ST.w, h: ST.h }} a={i * 3} b={30 + i * 3} border={ink.fg} fadeAt={out} z={0} />
      ))}
      <Pipeline out={out} />
      {/* Out: the camera dives through the "0" into the next page. */}
      <Cam keys={[[D - 40, HOME], [D, { x: ZERO.x, y: ZERO.y, s: 7 }]]}>
        <Why from={out + 10} />
      </Cam>
      <Disc x={dive.x} y={dive.y} r={ramp(fr, D - 18, D, 0, 2300, QIN)} color={ink.bg} z={9} />
    </>
  );
}
