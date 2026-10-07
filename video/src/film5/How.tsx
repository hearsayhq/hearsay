/**
 * How Hearsay works (the four steps of a voice conversation; Hearsay plays the ones Alexa+ runs,
 * from your test) and the rules it grades by (Amazon's published requirements for add-ons).
 */
import type { ReactNode } from 'react';
import { interpolate } from 'remotion';
import { cue } from './plan';
import { C, Chip, GRAD, GRAD_TEXT, Icon, mono, Pop, ramp, sans, squash, Stamp, useF } from '../film4/kit';
import { Melt } from '../film4/Open';

const W = (scene: string) => (line: string, i: number) => cue(scene, line, i);

const STATIONS = [
  { x: 260, label: 'Speech → text', icon: 'mic' },
  { x: 700, label: 'Model picks a tool', icon: 'model' },
  { x: 1180, label: 'Your server', icon: 'server' },
  { x: 1650, label: 'Answer spoken', icon: 'speaker' },
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
  const one = w('how1', 14);
  const plays = w('how2', 0);
  const checks = w('how2', 20);
  const dimAmazon = ramp(fr, one, one + 12) * (1 - ramp(fr, plays, plays + 14));
  const dim4 = ramp(fr, one, one + 12) * (1 - ramp(fr, checks, checks + 14));
  const serverGlow = ramp(fr, one, one + 12) * (1 - 0.5 * ramp(fr, plays, plays + 20));
  const bump = (at: number) => (fr >= at ? Math.exp(-(fr - at) / 10) * Math.sin((fr - at) / 2.5) : 0);
  const words = w('how2', 9);
  const mis = w('how2', 11);
  const tool = w('how2', 14);
  const drop = ramp(fr, w('how2', 15), w('how2', 17) + 4, 0, 1);
  const reply = ramp(fr, w('how2', 21), w('how2', 25), 0, 1);
  const called = w('how2', 17) + 4;
  const voice = ramp(fr, w('how1', 1) - 6, w('how1', 2) + 30);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Pop at={w('how1', 0)} x={420} y={110} out={w('how2', 0) - 8}><div style={{ fontFamily: sans, fontSize: 52, fontWeight: 900, color: C.text, whiteSpace: 'nowrap' }}>When a customer speaks</div></Pop>
      <div style={{ position: 'absolute', left: 260, right: 270, top: Y - 2, height: 4, background: 'rgba(255,255,255,0.12)', transformOrigin: 'left', transform: `scaleX(${ramp(fr, w('how1', 1), w('how1', 10) + 10)})` }} />
      {voice > 0 && voice < 1 ? <div style={{ position: 'absolute', left: interpolate(voice, [0, 1], [-60, 1700]) - 30, top: Y - 30, width: 60, height: 60, borderRadius: 30, background: C.amber, boxShadow: '0 0 40px rgba(255,170,43,0.8)' }} /> : null}
      <Station i={0} at={w('how1', 2) - 4} dim={dimAmazon} glow={0}>
        {fr >= words ? (
          <div style={{ fontFamily: sans, fontSize: 30, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>
            <div style={{ fontFamily: mono, fontSize: 18, color: C.amber, marginBottom: 10 }}>{fr >= mis ? 'HEARD' : 'SAID'}</div>
            add {fr >= mis ? <Melt from="fifteen" to="fifty" at={mis} size={30} color={C.text} /> : 'fifteen'}<br />dollars of fruit
          </div>
        ) : undefined}
      </Station>
      <Station i={1} at={w('how1', 3) - 4} dim={dimAmazon} glow={0}>
        {fr >= tool ? (
          <div style={{ fontFamily: mono, fontSize: 24, color: C.text, lineHeight: 1.45, textAlign: 'left' }}>
            <div style={{ fontSize: 18, color: C.amber, marginBottom: 8 }}>TOOL CALL</div>
            orders_stage_cart<br /><span style={{ color: C.muted }}>{'{ '}</span>amountUsd: <span style={{ color: '#FFB4B2' }}>50</span><span style={{ color: C.muted }}>{' }'}</span>
          </div>
        ) : undefined}
      </Station>
      <Station i={2} at={w('how1', 6) - 4} dim={0} glow={serverGlow + bump(w('how1', 8)) * 0.6 + (drop >= 1 ? bump(called) : 0)}>
        {fr >= called ? (
          <div style={{ fontFamily: mono, fontSize: 22, color: C.text, lineHeight: 1.5, textAlign: 'left', whiteSpace: 'pre' }}>
            <div style={{ fontSize: 16, letterSpacing: 2, color: C.blue, marginBottom: 8 }}>MCP · STREAMABLE HTTP</div>
            <span style={{ color: C.muted }}>→ initialize, tools/list</span><br />
            <span style={{ color: C.amber }}>→</span> tools/call<br />{'  '}orders_stage_cart<br />
            <span style={{ opacity: ramp(fr, called + 14, called + 24) }}><span style={{ color: C.blue }}>←</span> “Added.”</span>
          </div>
        ) : undefined}
      </Station>
      <Station i={3} at={w('how1', 10) - 4} dim={dim4} glow={0}>
        {fr >= checks + 6 ? (
          <div style={{ textAlign: 'left', fontFamily: sans, fontSize: 24, fontWeight: 600, color: C.text, lineHeight: 1.6 }}>
            <div style={{ fontFamily: mono, fontSize: 16, letterSpacing: 2, color: C.amber, marginBottom: 4 }}>YOUR SERVER’S REPLY</div>
            <div style={{ fontSize: 30, fontWeight: 800, marginBottom: 6 }}>“Added.”</div>
            {[['✓', 'under half a second', C.green], ['✓', 'no code read aloud', C.green], ['✗', 'took 50, never said it back', C.red]].map(([m, t, col], j) => (
              <div key={t} style={{ opacity: ramp(fr, checks + 10 + j * 8, checks + 18 + j * 8), color: col }}>{m} <span style={{ color: C.text }}>{t}</span></div>
            ))}
          </div>
        ) : undefined}
      </Station>
      {[0, 1, 3].map((i) => (
        <Pop key={i} at={one + 4 + i * 2} x={STATIONS[i]!.x} y={Y + 200}><Chip tint={C.muted} style={{ fontFamily: sans, fontSize: 22 }}>Alexa+</Chip></Pop>
      ))}
      <Pop at={one + 10} x={1180} y={Y + 195}><Chip tint={C.blue} solid style={{ fontFamily: sans, fontWeight: 800, fontSize: 24 }}>your code</Chip></Pop>
      <Sleeve at={plays} x0={70} x1={890} label="Hearsay plays this" />
      <Sleeve at={checks} x0={1460} x1={1840} label="Hearsay checks this" />
      <Pop at={w('how2', 5)} x={480} y={150} out={w('how3', 0) - 6}>
        <div style={{ fontFamily: mono, fontSize: 22, color: C.text, background: 'rgba(10,13,26,0.72)', border: '1.5px solid rgba(255,255,255,0.16)', borderRadius: 16, padding: '12px 20px', whiteSpace: 'pre', lineHeight: 1.5 }}>
          <span style={{ fontFamily: sans, fontSize: 16, letterSpacing: 2, color: C.muted }}>YOUR TEST</span>{'\n'}<span style={{ color: '#7c9bff' }}>say: </span><span style={{ color: C.amber }}>add fifteen dollars of fruit</span>
        </div>
      </Pop>
      {drop > 0 && drop < 1 ? <div style={{ position: 'absolute', left: interpolate(drop, [0, 1], [870, 1000]) - 20, top: Y - 20 - Math.sin(drop * Math.PI) * 70, width: 40, height: 40, borderRadius: 20, background: C.amber, boxShadow: '0 0 30px rgba(255,170,43,0.8)' }} /> : null}
      {reply > 0 && reply < 1 ? <div style={{ position: 'absolute', left: interpolate(reply, [0, 1], [1370, 1480]) - 18, top: Y - 18 - Math.sin(reply * Math.PI) * 60, width: 36, height: 36, borderRadius: 18, background: C.blue, boxShadow: `0 0 30px ${C.blue}` }} /> : null}
      <Pop at={mis + 6} x={330} y={765} rot={-1} out={w('how3', 0) - 6}>
        <div style={{ maxWidth: 560, fontFamily: sans, fontSize: 24, fontWeight: 600, color: C.text, padding: '12px 18px', borderRadius: 16, background: 'rgba(10,13,26,0.78)', border: `1.5px solid ${C.amber}` }}>
          <div style={{ fontFamily: mono, fontSize: 16, color: C.amber, letterSpacing: 2, marginBottom: 6 }}>THE MISHEARINGS</div>
          a table of known confusions, plus recorded ones; not Alexa’s own speech recognition
        </div>
      </Pop>
      <Stamp at={w('how3', 0) - 6} x={640} y={770} text="No API keys" color={C.amber} size={42} rot={4} />
      <Stamp at={w('how3', 5) - 6} x={1260} y={770} text="Same result every time" color={C.amber} size={38} rot={-4} />
      <Pop at={w('how3', 12) - 4} x={960} y={880}><Chip tint={C.amber} solid style={{ fontFamily: sans, fontWeight: 800, fontSize: 26, padding: '10px 22px' }}>so it runs on every change</Chip></Pop>
    </div>
  );
}

const RULES = [
  { word: 10, pre: '≤', big: '½', unit: 's', label: 'per tool call', id: 'latency.tool' },
  { word: 16, pre: '<', big: '30', unit: 's', label: 'to read any reply aloud', id: 'speak.length' },
  { word: 18, pre: '', big: '{ }', unit: '✕', label: 'no code, ids or tool names read aloud', id: 'speak.no_structured_dump' },
  { word: 22, pre: '≤', big: '5', unit: '', label: 'options read out', id: 'speak.lists' },
  { word: 27, pre: '', big: '', unit: 'what + how much', label: 'named before any payment', id: 'consent.states_details' },
] as const;

export function Rules() {
  const fr = useF();
  const w = W('rules');
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Pop at={w('rules', 0)} x={960} y={110}><div style={{ fontFamily: sans, fontSize: 36, fontWeight: 600, color: C.muted, whiteSpace: 'nowrap' }}>Replies are graded by</div></Pop>
      <Pop at={w('rules', 5)} x={960} y={190}><div style={{ fontFamily: sans, fontSize: 72, fontWeight: 900, color: C.text, whiteSpace: 'nowrap', letterSpacing: -1 }}>Amazon’s <span style={GRAD_TEXT}>published rules</span> for Alexa+ add-ons</div></Pop>
      <Pop at={w('rules', 9) + 4} x={960} y={275}><Chip tint={C.amber} style={{ fontFamily: sans, fontSize: 22 }}>from Amazon’s functional requirements for add-ons</Chip></Pop>
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
            <div style={{ marginTop: 'auto', fontFamily: sans, fontSize: 20, fontWeight: 600, color: C.muted }}>checked on every run</div>
          </div>
        );
      })}
      <Pop at={w('rules', 35) - 4} x={500} y={850} rot={1}>
        <div style={{ maxWidth: 640, fontFamily: sans, fontSize: 28, fontWeight: 700, color: C.text, padding: '16px 24px', borderRadius: 20, background: 'rgba(139,107,255,0.12)', border: '1.5px solid #8B6BFF' }}>
          + Hearsay’s own checks, for budgets and consent
          <div style={{ fontFamily: mono, fontSize: 16, color: '#B7A6FF', marginTop: 8 }}>EVERY FINDING NAMES ITS SOURCE</div>
        </div>
      </Pop>
      <Pop at={w('rules', 30)} x={1420} y={850} rot={-2}>
        <div style={{ maxWidth: 720, fontFamily: sans, fontSize: 28, fontWeight: 600, color: C.text, padding: '16px 24px', borderRadius: 20, background: 'rgba(255,170,43,0.12)', border: `1.5px solid ${C.amber}` }}>
          “Place the order: two cartons of milk, seven dollars and forty cents?”
          <div style={{ fontFamily: mono, fontSize: 16, color: C.amber, marginTop: 8 }}>THE FIXED ADD-ON’S REAL QUESTION</div>
        </div>
      </Pop>
    </div>
  );
}
