/**
 * How Hearsay works (the four steps of a voice conversation; Hearsay plays the ones Amazon runs)
 * and the rules it grades by (Amazon's published requirements, with the check that tests each).
 */
import type { ReactNode } from 'react';
import { interpolate } from 'remotion';
import { cue } from './plan';
import { C, Chip, GRAD, GRAD_TEXT, Icon, mono, Pop, ramp, sans, squash, Stamp, stick, useF } from './kit';
import { Melt } from './Open';

const W = (scene: string) => (line: string, i: number) => cue(scene, line, i);

const STATIONS = [
  { x: 260, label: 'Speech → text', icon: 'mic' },
  { x: 700, label: 'Model picks a tool', icon: 'model' },
  { x: 1180, label: 'Your server', icon: 'server' },
  { x: 1650, label: 'Reply spoken', icon: 'speaker' },
] as const;
const Y = 430;

function Station({ i, at, dim, glow, children }: { i: number; at: number; dim: number; glow: number; children?: ReactNode }) {
  const fr = useF();
  if (fr < at) return null;
  const s = STATIONS[i]!;
  const { k, sx, sy } = squash(fr, at);
  const server = i === 2;
  const w = server ? 380 : 330;
  const h = server ? 280 : 240;
  const tint = server ? C.blue : C.text;
  return (
    <div style={{ position: 'absolute', left: s.x - w / 2, top: Y - h / 2, width: w, height: h, borderRadius: 28, background: server ? 'rgba(142,162,255,0.12)' : 'rgba(12,15,30,0.62)', border: `2px solid ${server ? C.blue : 'rgba(255,255,255,0.16)'}`, transform: `translateY(${(1 - k) * 60}px) scale(${sx * (1 + glow * 0.06)},${sy * (1 + glow * 0.06)})`, opacity: Math.min(1, k * 2.5) * (1 - dim * 0.62), boxShadow: glow > 0 ? `0 0 ${90 * glow}px ${C.blue}88` : '0 30px 70px rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center', padding: 20 }}>
      {children ?? (
        <>
          <Icon name={s.icon} size={64} color={tint} />
          <div style={{ fontFamily: sans, fontSize: 32, fontWeight: 800, color: C.text }}>{s.label}</div>
        </>
      )}
    </div>
  );
}

/** Amber glass over the steps Hearsay takes over. */
function Sleeve({ at, x0, x1, label }: { at: number; x0: number; x1: number; label: string }) {
  const fr = useF();
  if (fr < at) return null;
  const { k } = squash(fr, at);
  const w = (x1 - x0) * k;
  return (
    <>
      <svg style={{ position: 'absolute', left: x0 - 4, top: Y - 179, overflow: 'visible' }} width={w + 8} height={358}>
        <defs><linearGradient id={`sleeve${x0}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFB23F" /><stop offset="0.52" stopColor="#FF5E8A" /><stop offset="1" stopColor="#8B6BFF" /></linearGradient></defs>
        <rect x={4} y={4} width={Math.max(0, w)} height={350} rx={36} fill="rgba(255,120,140,0.07)" stroke={`url(#sleeve${x0})`} strokeWidth={3} style={{ filter: 'drop-shadow(0 0 30px rgba(255,94,138,0.35))' }} />
      </svg>
      <div style={{ position: 'absolute', left: x0 + (x1 - x0) / 2, top: Y - 175, transform: `translate(-50%,-50%) scale(${k})` }}><div style={{ fontFamily: sans, fontWeight: 800, fontSize: 24, color: '#0b0d18', background: GRAD, borderRadius: 999, padding: '8px 20px', whiteSpace: 'nowrap' }}>{label}</div></div>
    </>
  );
}

export function How() {
  const fr = useF();
  const w = W('how');
  const one = w('how1', 5);
  const plays = w('how2', 0);
  const checks = w('how2', 23);
  const dimAmazon = ramp(fr, one, one + 12) * (1 - ramp(fr, plays, plays + 14));
  const dim4 = ramp(fr, one, one + 12) * (1 - ramp(fr, checks, checks + 14));
  const serverGlow = ramp(fr, one, one + 12) * (1 - 0.5 * ramp(fr, plays, plays + 20));
  const bump = (at: number) => (fr >= at ? Math.exp(-(fr - at) / 10) * Math.sin((fr - at) / 2.5) : 0);
  const words = w('how2', 10);
  const mis = w('how2', 12);
  const tool = w('how2', 15);
  const drop = ramp(fr, w('how2', 18), w('how2', 20) + 4, 0, 1);
  const reply = ramp(fr, w('how2', 24), w('how2', 27), 0, 1);
  const stampsOut = w('how3', 8) - 4;
  const voice = ramp(fr, w('how1', 3) - 6, w('how1', 4) + 30);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Pop at={w('how1', 0)} x={300} y={110} out={w('how2', 4) - 8}><div style={{ fontFamily: sans, fontSize: 60, fontWeight: 900, color: C.text, whiteSpace: 'nowrap' }}>Here’s how.</div></Pop>
      <div style={{ position: 'absolute', left: 260, right: 270, top: Y - 2, height: 4, background: 'rgba(255,255,255,0.12)', transformOrigin: 'left', transform: `scaleX(${ramp(fr, w('how1', 3), w('how1', 4) + 26)})` }} />
      {voice > 0 && voice < 1 ? <div style={{ position: 'absolute', left: interpolate(voice, [0, 1], [-60, 1700]) - 30, top: Y - 30, width: 60, height: 60, borderRadius: 30, background: C.amber, boxShadow: '0 0 40px rgba(255,170,43,0.8)' }} /> : null}
      <Station i={0} at={w('how1', 3)} dim={dimAmazon} glow={0}>
        {fr >= words ? (
          <div style={{ fontFamily: sans, fontSize: 30, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>
            <div style={{ fontFamily: mono, fontSize: 18, color: C.amber, marginBottom: 10 }}>{fr >= mis ? 'HEARD' : 'SAID'}</div>
            add {fr >= mis ? <Melt from="fifteen" to="fifty" at={mis} size={30} color={C.text} /> : 'fifteen'}<br />dollars of fruit
          </div>
        ) : undefined}
      </Station>
      <Station i={1} at={w('how1', 3) + 7} dim={dimAmazon} glow={0}>
        {fr >= tool ? (
          <div style={{ fontFamily: mono, fontSize: 24, color: C.text, lineHeight: 1.45, textAlign: 'left' }}>
            <div style={{ fontSize: 18, color: C.amber, marginBottom: 8 }}>TOOL CALL</div>
            orders_stage_cart<br /><span style={{ color: C.muted }}>{'{ '}</span>amountUsd: <span style={{ color: '#FFB4B2' }}>50</span><span style={{ color: C.muted }}>{' }'}</span>
          </div>
        ) : undefined}
      </Station>
      <Station i={2} at={w('how1', 3) + 14} dim={0} glow={serverGlow + bump(w('how1', 12)) * 0.6 + (drop >= 1 ? bump(w('how2', 20) + 4) : 0)} />
      <Station i={3} at={w('how1', 3) + 21} dim={dim4} glow={0}>
        {fr >= checks + 6 ? (
          <div style={{ textAlign: 'left', fontFamily: sans, fontSize: 24, fontWeight: 600, color: C.text, lineHeight: 1.6 }}>
            <div style={{ fontSize: 30, fontWeight: 800, marginBottom: 6 }}>“Added.”</div>
            {[['✓', 'under 500 ms', C.green], ['✓', 'no JSON', C.green], ['✗', 'took the misheard 50', C.red]].map(([m, t, col], j) => (
              <div key={t} style={{ opacity: ramp(fr, checks + 10 + j * 8, checks + 18 + j * 8), color: col }}>{m} <span style={{ color: C.text }}>{t}</span></div>
            ))}
          </div>
        ) : undefined}
      </Station>
      {[0, 1, 3].map((i) => (
        <Pop key={i} at={one + 4 + i * 2} x={STATIONS[i]!.x} y={Y + 175} out={i === 3 ? checks - 6 : plays - 6}><Chip tint={C.muted} style={{ fontFamily: sans, fontSize: 22 }}>Amazon</Chip></Pop>
      ))}
      <Pop at={one + 10} x={1180} y={Y + 195}><Chip tint={C.blue} solid style={{ fontFamily: sans, fontWeight: 800, fontSize: 24 }}>your code</Chip></Pop>
      <Sleeve at={plays} x0={70} x1={890} label="Hearsay plays this" />
      <Sleeve at={checks} x0={1460} x1={1840} label="Hearsay checks this" />
      <Pop at={w('how2', 4)} x={480} y={150} out={stampsOut}>
        <div style={{ fontFamily: mono, fontSize: 22, color: C.text, background: 'rgba(10,13,26,0.72)', border: '1.5px solid rgba(255,255,255,0.16)', borderRadius: 16, padding: '12px 20px', whiteSpace: 'pre', lineHeight: 1.5 }}>
          <span style={{ color: '#7c9bff' }}>say: </span><span style={{ color: C.amber }}>add fifteen dollars of fruit</span>{'\n'}<span style={{ color: '#7c9bff' }}>fuzz: </span>[asr.number_confusion]
        </div>
      </Pop>
      {drop > 0 && drop < 1 ? <div style={{ position: 'absolute', left: interpolate(drop, [0, 1], [870, 1000]) - 20, top: Y - 20 - Math.sin(drop * Math.PI) * 70, width: 40, height: 40, borderRadius: 20, background: C.amber, boxShadow: '0 0 30px rgba(255,170,43,0.8)' }} /> : null}
      {reply > 0 && reply < 1 ? <div style={{ position: 'absolute', left: interpolate(reply, [0, 1], [1370, 1480]) - 18, top: Y - 18 - Math.sin(reply * Math.PI) * 60, width: 36, height: 36, borderRadius: 18, background: C.blue, boxShadow: `0 0 30px ${C.blue}` }} /> : null}
      <Stamp at={w('how3', 1) - 4} x={520} y={760} text="No microphone" color={C.amber} size={46} rot={-6} out={stampsOut} />
      <Stamp at={w('how3', 3) - 4} x={960} y={760} text="No model" color={C.amber} size={46} rot={4} out={stampsOut} />
      <Stamp at={w('how3', 6) - 6} x={1400} y={760} text="No API keys" color={C.amber} size={46} rot={-4} out={stampsOut} />
      <Same at={w('how3', 8)} out={w('how3', 14) - 6} />
      <Pop at={w('how3', 14) - 2} x={960} y={770}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '20px 30px', borderRadius: 20, background: 'rgba(12,15,30,0.62)', border: '1.5px solid rgba(255,255,255,0.18)', boxShadow: '0 30px 70px rgba(0,0,0,0.5)' }}>
          <Icon name="pr" size={44} color={C.text} />
          <div style={{ fontFamily: mono, fontSize: 30, color: C.text }}>hearsay / voice</div>
          <Chip tint={C.amber} style={{ fontFamily: sans, fontSize: 22 }}>on every pull request</Chip>
        </div>
      </Pop>
    </div>
  );
}

/** Three runs, one fingerprint: same inputs, same result. */
function Same({ at, out }: { at: number; out: number }) {
  const fr = useF();
  if (fr < at || fr > out + 12) return null;
  const bars = [6, 11, 4, 9, 13, 7, 10, 5, 12, 8, 6, 10];
  const o = 1 - ramp(fr, out, out + 10);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 690, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 26, opacity: o }}>
      {[0, 1, 2].map((r) => {
        const k = stick(fr, at + r * 6);
        return (
          <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
            {r ? <div style={{ fontFamily: sans, fontSize: 56, fontWeight: 900, color: C.amber, opacity: k }}>=</div> : null}
            <div style={{ transform: `scale(${k})`, padding: '16px 22px', borderRadius: 18, background: 'rgba(12,15,30,0.62)', border: '1.5px solid rgba(255,255,255,0.16)' }}>
              <div style={{ fontFamily: mono, fontSize: 18, color: C.muted, marginBottom: 10 }}>RUN {r + 1}</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 56 }}>{bars.map((b, i) => <div key={i} style={{ width: 10, height: b * 4, borderRadius: 3, background: C.amber }} />)}</div>
            </div>
          </div>
        );
      })}
      <div style={{ fontFamily: sans, fontSize: 34, fontWeight: 800, color: C.text, marginLeft: 20, opacity: ramp(fr, at + 16, at + 26) }}>same result,<br />every time</div>
    </div>
  );
}

const RULES = [
  { word: 11, pre: '≤', big: '500', unit: 'ms', label: 'per tool round trip', id: 'latency.tool' },
  { word: 16, pre: '<', big: '30', unit: 's', label: 'per spoken reply', id: 'speak.length' },
  { word: 18, pre: '', big: '{ }', unit: '✕', label: 'no JSON, ids or tool names', id: 'speak.no_structured_dump' },
  { word: 20, pre: '≤', big: '5', unit: '', label: 'options read out', id: 'speak.lists' },
  { word: 26, pre: '', big: '', unit: 'what + how much', label: 'named before any payment', id: 'consent.states_details' },
] as const;

export function Rules() {
  const fr = useF();
  const w = W('rules');
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Pop at={w('rules', 0)} x={960} y={110}><div style={{ fontFamily: sans, fontSize: 36, fontWeight: 600, color: C.muted, whiteSpace: 'nowrap' }}>Every answer is graded by</div></Pop>
      <Pop at={w('rules', 6)} x={960} y={190}><div style={{ fontFamily: sans, fontSize: 72, fontWeight: 900, color: C.text, whiteSpace: 'nowrap', letterSpacing: -1 }}>Amazon’s <span style={GRAD_TEXT}>published rules</span> for add-ons</div></Pop>
      <Pop at={w('rules', 8) + 4} x={960} y={275}><Chip tint={C.amber}>every finding names its source: amazon-fr</Chip></Pop>
      {RULES.map((r, i) => {
        const at = w('rules', r.word) - 3;
        if (fr < at) return null;
        const { k, sx, sy } = squash(fr, at, 2);
        const x = 100 + i * 352;
        return (
          <div key={r.id} style={{ position: 'absolute', left: x, top: 350, width: 332, height: 390, transform: `translateY(${(1 - k) * 300}px) rotate(${(1 - k) * (i % 2 ? 8 : -8)}deg) scale(${sx},${sy})`, transformOrigin: 'bottom center', borderRadius: 26, background: 'rgba(12,15,30,0.62)', border: '1.5px solid rgba(255,170,43,0.45)', boxShadow: '0 30px 70px rgba(0,0,0,0.45)', padding: '34px 26px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: sans, fontWeight: 900, color: C.amber, lineHeight: 1, minHeight: 100, letterSpacing: -1, display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: r.big ? 'nowrap' : 'wrap' }}>
              {r.pre ? <span style={{ fontSize: 44 }}>{r.pre}</span> : null}
              {r.big ? <span style={{ fontSize: 84 }}>{r.big}</span> : null}
              {r.unit ? <span style={{ fontSize: r.big ? 40 : 50, lineHeight: 1.05 }}>{r.unit}</span> : null}
            </div>
            <div style={{ fontFamily: sans, fontSize: 30, fontWeight: 700, color: C.text, marginTop: 18, lineHeight: 1.2 }}>{r.label}</div>
            <div style={{ marginTop: 'auto', fontFamily: mono, fontSize: 18, color: C.muted }}>{r.id}</div>
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}><Chip tint={C.red} style={{ fontSize: 15, padding: '3px 10px' }}>error</Chip><Chip tint={C.muted} style={{ fontSize: 15, padding: '3px 10px' }}>amazon-fr</Chip></div>
          </div>
        );
      })}
      <Pop at={w('rules', 28)} x={1420} y={850} rot={-2}>
        <div style={{ maxWidth: 720, fontFamily: sans, fontSize: 28, fontWeight: 600, color: C.text, padding: '16px 24px', borderRadius: 20, background: 'rgba(255,170,43,0.12)', border: `1.5px solid ${C.amber}` }}>
          “Place the order: two cartons of milk, seven dollars and forty cents?”
          <div style={{ fontFamily: mono, fontSize: 16, color: C.amber, marginTop: 8 }}>REAL QUESTION · FIXED BUILD</div>
        </div>
      </Pop>
    </div>
  );
}
