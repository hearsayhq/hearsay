/**
 * The first three scenes: what goes wrong (real replies of the flawed build), why a chat window
 * hides it, and Hearsay, introduced from a real test case of suites/household-orders.yaml.
 */
import type { ReactNode } from 'react';
import { interpolate } from 'remotion';
import { cue, sceneFrames } from './plan';
import { ANCHOR } from './world';
import { C, Chip, clamp, Icon, mono, Pop, ramp, sans, squash, Stamp, Starburst, stick, useF } from './kit';

const W = (scene: string) => (line: string, i: number) => cue(scene, line, i);
/** Where a point of scene `a` sits in scene `b`'s own coordinates. */
export const carried = (a: string, b: string, [x, y]: [number, number]): [number, number] => [x - (ANCHOR[b]![0] - ANCHOR[a]![0]), y - (ANCHOR[b]![1] - ANCHOR[a]![1])];

/** A word that melts into another one: "fifteen" drips away, "fifty" rises. */
export function Melt({ from, to, at, size = 44, color = C.text, toColor = C.red, weight = 700 }: { from: string; to: string; at: number; size?: number; color?: string; toColor?: string; weight?: number }) {
  const fr = useF();
  const p = ramp(fr, at, at + 16);
  const q = ramp(fr, at + 6, at + 22);
  const melting = fr >= at && fr <= at + 24;
  return (
    <span style={{ position: 'relative', display: 'inline-block', fontFamily: sans, fontWeight: weight, fontSize: size, filter: melting ? 'url(#goo-text)' : undefined }}>
      <span style={{ visibility: 'hidden' }}>{p < 0.5 ? from : to}</span>
      <span style={{ position: 'absolute', left: 0, top: 0, color, opacity: 1 - p, transform: `translateY(${p * size * 0.9}px) scaleY(${1 + p * 0.8})`, transformOrigin: 'top' }}>{from}</span>
      <span style={{ position: 'absolute', left: 0, top: 0, color: toColor, opacity: q, transform: `translateY(${(1 - q) * -size * 0.7}px) scaleY(${0.6 + q * 0.4})`, transformOrigin: 'bottom' }}>{to}</span>
    </span>
  );
}

/** The add-on as a voice: an amber orb with satellites that burst out when it replies. */
function Orb({ x, y, r, beats, tint = C.amber }: { x: number; y: number; r: number; beats: number[]; tint?: string }) {
  const fr = useF();
  const last = beats.filter((b) => b <= fr).pop();
  const kick = last === undefined ? 0 : Math.exp(-(fr - last) / 14) * Math.sin((fr - last) / 3.2);
  const breathe = Math.sin(fr / 22) * 0.03;
  const sats = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 + fr / 70;
    const d = r * (1.12 + 0.5 * Math.abs(kick) + 0.1 * Math.sin(fr / 13 + i));
    return { x: Math.cos(a) * d, y: Math.sin(a) * d, s: r * (0.2 + 0.07 * Math.sin(fr / 17 + i * 2)) };
  });
  return (
    <div style={{ position: 'absolute', left: x - r * 2, top: y - r * 2, width: r * 4, height: r * 4, filter: 'url(#goo)', transform: `scale(${stick(fr, 0, { damping: 9, stiffness: 160 })})` }}>
      <div style={{ position: 'absolute', left: r, top: r, width: r * 2, height: r * 2, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, #FFD58A, ${tint} 55%, #C9741A)`, transform: `scale(${1 + breathe + kick * 0.12})` }} />
      {sats.map((s, i) => <div key={i} style={{ position: 'absolute', left: r * 2 + s.x - s.s, top: r * 2 + s.y - s.s, width: s.s * 2, height: s.s * 2, borderRadius: '50%', background: tint }} />)}
    </div>
  );
}

/** One line of the conversation: who, then what. */
function Row({ y, at, who, children, tone = 'addon', out }: { y: number; at: number; who: string; children: ReactNode; tone?: 'said' | 'addon'; out?: number }) {
  const fr = useF();
  if (fr < at) return null;
  const { k, sx, sy } = squash(fr, at);
  const o = out === undefined ? 1 : ramp(fr, out, out + 12, 1, 0);
  const said = tone === 'said';
  return (
    <div style={{ position: 'absolute', left: 520, top: y, transformOrigin: 'left center', transform: `translateX(${(1 - k) * 90}px) scale(${sx},${sy})`, opacity: Math.min(1, k * 2.5) * o, display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ fontFamily: mono, fontSize: 18, letterSpacing: 2, color: said ? C.amber : C.muted, width: 110, textAlign: 'right', textTransform: 'uppercase' }}>{who}</div>
      <div style={{ fontFamily: sans, fontSize: 38, fontWeight: 600, color: C.text, padding: '12px 26px', borderRadius: 22, background: said ? 'rgba(255,170,43,0.10)' : 'rgba(255,255,255,0.06)', border: `1.5px solid ${said ? 'rgba(255,170,43,0.55)' : 'rgba(255,255,255,0.16)'}`, whiteSpace: 'nowrap' }}>{children}</div>
    </div>
  );
}

export function Cold() {
  const fr = useF();
  const w = W('cold');
  const D = sceneFrames('cold');
  const replies = [w('cold', 14), w('cold', 18), w('cold', 21) + 8, w('cold', 25)];
  const shake = fr > w('cold', 27) ? Math.exp(-(fr - w('cold', 27)) / 6) * Math.sin(fr * 2.4) * 10 : 0;
  const leave = D - 26;
  const gather = ramp(fr, leave, D, 0, 1);
  const rowsOut = leave;
  return (
    <div style={{ position: 'absolute', inset: 0, transform: `translate(${shake}px, ${shake * 0.4}px)` }}>
      <Shock />
      <Orb x={290} y={420} r={84} beats={replies} />
      <Pop at={w('cold', 1)} x={290} y={620}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: sans, fontSize: 38, fontWeight: 800, color: C.text }}>A grocery add-on</div>
          <div style={{ marginTop: 12 }}><Chip tint={C.red}>flawed build</Chip></div>
        </div>
      </Pop>
      <Row y={110} at={w('cold', 6) - 6} who="said" tone="said" out={rowsOut}>add <span style={{ color: C.amber }}>fifteen</span> dollars of fruit</Row>
      {fr >= w('cold', 11) - 2 ? (
        <Row y={210} at={w('cold', 11) - 2} who="heard" tone="said" out={rowsOut}>add <Melt from="fifteen" to="fifty" at={w('cold', 12) - 4} size={40} color={C.amber} /> dollars of fruit</Row>
      ) : null}
      <Row y={330} at={w('cold', 14)} who="add-on" out={rowsOut}>Are you sure?</Row>
      <Row y={430} at={w('cold', 18)} who="add-on" out={rowsOut}>Added.</Row>
      <Row y={570} at={w('cold', 20)} who="said" tone="said" out={rowsOut}>okay, place the order</Row>
      <Row y={670} at={w('cold', 21) + 4} who="add-on" out={rowsOut}>Are you sure? <span style={{ marginLeft: 18, fontFamily: sans, fontSize: 30, fontWeight: 800, color: C.ink, background: C.red, padding: '6px 22px', borderRadius: 12 }}>No</span></Row>
      <Row y={790} at={w('cold', 25)} who="add-on" out={rowsOut}><span style={{ color: '#FFD3D2', fontSize: 34 }}>Order placed: two cartons of milk, seven dollars and forty cents.</span></Row>
      <Stamp at={w('cold', 27)} x={1440} y={470} text="Order placed" sub="after a “No”" size={72} rot={-7} />
      {fr >= leave ? (
        <div style={{ position: 'absolute', left: 1180 - 330, top: 470 - 210, width: 660, height: 420, borderRadius: 28, background: C.ink2, border: '1.5px solid rgba(255,255,255,0.18)', opacity: gather, transform: `scale(${0.6 + 0.4 * gather})` }} />
      ) : null}
      <Pop at={w('cold', 3)} x={290} y={730} out={leave}>
        <div style={{ fontFamily: mono, fontSize: 16, color: C.muted, letterSpacing: 1, textAlign: 'center', lineHeight: 1.5 }}>REAL REPLIES, WORD FOR WORD<br />suites/household-orders.yaml</div>
      </Pop>
    </div>
  );
}

/** Frame one: a drop of sound hits and rings out. */
function Shock() {
  const fr = useF();
  if (fr > 70) return null;
  const rings = [0, 8, 16];
  return (
    <>
      {rings.map((d) => {
        const p = ramp(fr, d, d + 46);
        return <div key={d} style={{ position: 'absolute', left: 290 - 600 * p, top: 420 - 600 * p, width: 1200 * p, height: 1200 * p, borderRadius: '50%', border: `${3 + 6 * (1 - p)}px solid rgba(255,170,43,${0.6 * (1 - p)})` }} />;
      })}
    </>
  );
}

const CARDS = [
  { x: 440, y: 250, word: 12, rot: -4 },
  { x: 1480, y: 250, word: 15, rot: 3 },
  { x: 440, y: 720, word: 19, rot: 3 },
  { x: 1480, y: 720, word: 27, rot: -3 },
] as const;
const LIST = ['milk', 'eggs', 'bread', 'fruit', 'oat milk', 'butter', 'rice', 'tea', 'jam', 'flour', 'soap', 'coffee'];

function Card({ i, children, label }: { i: number; children: ReactNode; label: string }) {
  const fr = useF();
  const w = W('prob');
  const card = CARDS[i]!;
  const at = w('prob', card.word) + 6;
  const D = sceneFrames('prob');
  const suck = ramp(fr, D - 34 + i * 3, D - 12 + i * 3, 0, 1, (t) => t * t);
  if (fr < at || suck >= 1) return null;
  const { k, sx, sy } = squash(fr, at);
  const x = interpolate(k, [0, 1], [960, card.x], clamp) * (1 - suck) + 960 * suck;
  const y = interpolate(k, [0, 1], [470, card.y], clamp) * (1 - suck) + 470 * suck;
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${card.rot * k}deg) scale(${(0.2 + 0.8 * k) * sx * (1 - suck)},${(0.2 + 0.8 * k) * sy * (1 - suck)})`, width: 600, padding: '28px 32px', borderRadius: 26, background: 'rgba(16,26,48,0.94)', border: '1.5px solid rgba(255,94,91,0.55)', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>
      <div style={{ minHeight: 110, display: 'flex', alignItems: 'center' }}>{children}</div>
      <div style={{ marginTop: 14, fontFamily: sans, fontSize: 30, fontWeight: 800, color: C.text }}>{label}</div>
    </div>
  );
}

export function Prob() {
  const fr = useF();
  const w = W('prob');
  const D = sceneFrames('prob');
  // The conversation from the cold open arrives as a chat window, then turns into a voice.
  const [cx, cy] = carried('cold', 'prob', [1180, 470]);
  const arrive = stick(fr, -18, { damping: 14, stiffness: 120 });
  const winX = interpolate(arrive, [0, 1], [cx, 960]);
  const winY = interpolate(arrive, [0, 1], [cy, 470]);
  const loud = ramp(fr, w('prob', 8), w('prob', 8) + 20);
  const crack = fr >= w('prob', 11);
  const crackK = ramp(fr, w('prob', 11), w('prob', 11) + 10);
  const shake = crack ? Math.exp(-(fr - w('prob', 11)) / 7) * Math.sin(fr * 2.2) * 9 : 0;
  const ww = interpolate(loud, [0, 1], [660, 250]);
  const hh = interpolate(loud, [0, 1], [420, 250]);
  const swallow = ramp(fr, D - 30, D - 4, 0, 1);
  const lines = [
    { who: 'you typed', text: 'Add $15 of fruit', at: w('prob', 2) },
    { who: 'add-on', text: 'Added.', at: w('prob', 3) + 10 },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', left: winX + shake - ww / 2, top: winY - hh / 2, width: ww, height: hh, borderRadius: interpolate(loud, [0, 1], [28, 125]), background: loud > 0 ? `radial-gradient(circle at 35% 30%, #FFD58A, ${C.amber} ${55 + 0 * loud}%, #C9741A)` : C.ink2, border: `1.5px solid ${loud > 0.5 ? 'transparent' : 'rgba(255,255,255,0.18)'}`, boxShadow: loud > 0.5 ? `0 0 ${80 + 60 * swallow}px rgba(255,170,43,0.5)` : '0 40px 100px rgba(0,0,0,0.5)', overflow: 'hidden', transform: `scale(${1 + swallow * 0.35})` }}>
        <div style={{ opacity: 1 - ramp(fr, w('prob', 8) - 4, w('prob', 8) + 6), padding: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: mono, fontSize: 18, color: C.muted, marginBottom: 26 }}>CHAT WINDOW</div>
          {lines.map((l) => fr >= l.at ? (
            <div key={l.text} style={{ display: 'flex', justifyContent: l.who === 'add-on' ? 'flex-start' : 'flex-end', marginBottom: 18, opacity: ramp(fr, l.at, l.at + 8) }}>
              <div style={{ fontFamily: sans, fontSize: 34, fontWeight: 600, color: C.text, padding: '12px 22px', borderRadius: 18, background: l.who === 'add-on' ? 'rgba(255,255,255,0.08)' : 'rgba(142,162,255,0.22)' }}>{l.text}</div>
            </div>
          ) : null)}
        </div>
        {crack ? (
          <svg viewBox="0 0 250 250" style={{ position: 'absolute', inset: 0, opacity: crackK }}>
            <path d="M125 10 L112 80 L140 118 L104 168 L126 240 M140 118 L205 104 M112 80 L52 66 M104 168 L40 190" stroke="#3a1206" strokeWidth={5} fill="none" strokeDasharray={600} strokeDashoffset={600 * (1 - crackK)} />
          </svg>
        ) : null}
      </div>
      <Stamp at={w('prob', 6)} x={1260} y={250} text="Looks fine" color={C.green} size={54} rot={6} out={w('prob', 8)} />
      <Pop at={w('prob', 8)} x={960} y={470 + 185} out={w('prob', 12) - 2}>
        <div style={{ fontFamily: sans, fontSize: 56, fontWeight: 900, color: C.text }}>Out loud…</div>
      </Pop>
      <Card i={0} label="Numbers get misheard">
        <div>
          <div style={{ fontFamily: mono, fontSize: 20, color: C.muted, marginBottom: 6 }}>SAID fifteen · HEARD</div>
          <div style={{ fontFamily: sans, fontSize: 64, fontWeight: 800, color: C.text }}><Melt from="fifteen" to="fifty" at={w('prob', 14)} size={64} color={C.text} weight={800} /></div>
        </div>
      </Card>
      <Card i={1} label="Replies read out JSON">
        <div style={{ fontFamily: mono, fontSize: 30, color: '#FFB4B2', lineHeight: 1.35 }}>{'{"sku":"sku-fruit",'}<br />{' "amountUsd":50}'}</div>
      </Card>
      <Card i={2} label="Lists too long to remember">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {LIST.slice(0, Math.min(LIST.length, 1 + Math.floor(Math.max(0, fr - w('prob', 19)) / 4))).map((x) => <span key={x} style={{ fontFamily: sans, fontSize: 22, fontWeight: 600, color: C.text, background: 'rgba(255,255,255,0.08)', padding: '4px 12px', borderRadius: 999 }}>{x}</span>)}
        </div>
      </Card>
      <Card i={3} label="Money moves without a clear yes">
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, fontFamily: sans, fontSize: 44, fontWeight: 800, color: C.text }}>
          <span style={{ width: 84, height: 84, borderRadius: '50%', background: C.amber, color: C.ink, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>$</span>
          <span style={{ color: C.muted }}>→</span>
          <span style={{ textDecoration: 'line-through', color: C.muted }}>yes?</span>
          <span style={{ color: C.muted }}>→</span>
          <span style={{ color: '#FFB4B2' }}>paid</span>
        </div>
      </Card>
    </div>
  );
}

const LETTERS = 'HEARSAY'.split('');

export function Intro() {
  const fr = useF();
  const w = W('intro');
  const hit = w('intro', 2) - 3;
  // The voice from the last scene arrives and becomes the word.
  const [ox, oy] = carried('prob', 'intro', [960, 470]);
  const arrive = stick(fr, -16, { damping: 15, stiffness: 110 });
  const orbX = interpolate(arrive, [0, 1], [ox, 960]);
  const orbY = interpolate(arrive, [0, 1], [oy, 430]);
  const flat = ramp(fr, hit - 6, hit + 6);
  const shrink = stick(fr, w('intro', 8) - 4, { damping: 16, stiffness: 150 });
  // The wordmark moves to the corner when the test case comes in.
  const mark = { x: interpolate(shrink, [0, 1], [960, 300]), y: interpolate(shrink, [0, 1], [430, 120]), s: interpolate(shrink, [0, 1], [1, 0.34]) };
  const tag = ['Preflight', 'checks', 'for', 'voice', 'add-ons'];
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {fr < hit + 8 ? (
        <div style={{ position: 'absolute', left: orbX - interpolate(flat, [0, 1], [125 * (1 + 0.04 * Math.sin(fr / 5)), 460]), top: orbY - interpolate(flat, [0, 1], [125, 8]) + flat * 130, width: interpolate(flat, [0, 1], [250 * (1 + 0.04 * Math.sin(fr / 5)), 920]), height: interpolate(flat, [0, 1], [250, 16]), borderRadius: 125, background: `radial-gradient(circle at 35% 30%, #FFD58A, ${C.amber} 55%, #C9741A)`, boxShadow: '0 0 120px rgba(255,170,43,0.5)' }} />
      ) : null}
      <div style={{ position: 'absolute', left: mark.x, top: mark.y, transform: `translate(-50%,-50%) scale(${mark.s})` }}>
        <div style={{ position: 'relative', display: 'flex' }}>
          {LETTERS.map((ch, i) => {
            const at = hit + i * 2;
            if (fr < at) return <span key={i} style={{ fontFamily: sans, fontSize: 230, fontWeight: 900, letterSpacing: -6, opacity: 0 }}>{ch}</span>;
            const { k, sx, sy } = squash(fr, at, 2.2);
            return <span key={i} style={{ display: 'inline-block', fontFamily: sans, fontSize: 230, fontWeight: 900, letterSpacing: -6, color: C.text, transform: `translateY(${(1 - k) * -260}px) rotate(${(1 - k) * (i % 2 ? 14 : -14)}deg) scale(${sx},${sy})`, transformOrigin: 'bottom' }}>{ch}</span>;
          })}
        </div>
        {fr >= hit ? <div style={{ position: 'absolute', left: '50%', bottom: -14, height: 18, borderRadius: 9, background: C.amber, width: `${100 * stick(fr, hit, { damping: 18 })}%`, transform: 'translateX(-50%)', boxShadow: '0 0 50px rgba(255,170,43,0.6)' }} /> : null}
      </div>
      {fr >= hit + 10 && fr < w('intro', 8) + 20 ? (
        <div style={{ position: 'absolute', left: 1590, top: 205, transform: `translate(-50%,-50%) scale(${stick(fr, hit + 10) * (1 - ramp(fr, w('intro', 8) - 4, w('intro', 8) + 12))})` }}>
          <Starburst size={270} spin={fr * 0.25} points={22}>
            <div style={{ fontFamily: sans, fontSize: 70, fontWeight: 900, color: C.ink, lineHeight: 0.9 }}>NEW</div>
            <div style={{ fontFamily: sans, fontSize: 19, fontWeight: 800, color: C.ink, marginTop: 6, lineHeight: 1.15 }}>for Alexa+<br />MCP servers</div>
          </Starburst>
        </div>
      ) : null}
      {fr < w('intro', 8) + 10 ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 640, display: 'flex', justifyContent: 'center', gap: 16, opacity: 1 - ramp(fr, w('intro', 8) - 6, w('intro', 8) + 6) }}>
          {tag.map((t, i) => {
            const at = w('intro', 3 + i) - 2;
            const k = fr >= at ? stick(fr, at) : 0;
            return <span key={t} style={{ fontFamily: sans, fontSize: 60, fontWeight: 700, color: i === 3 ? C.amber : C.text, opacity: Math.min(1, k * 2), transform: `translateY(${(1 - k) * 40}px)`, display: 'inline-block' }}>{t}</span>;
          })}
        </div>
      ) : null}
      <Pop at={w('intro', 7) + 6} x={960} y={760} out={w('intro', 8) - 4}><Chip tint={C.muted}>open source · unofficial</Chip></Pop>
      <TestCase />
    </div>
  );
}

const CASE = [
  ['- id: ', 'misheard-amount'],
  ['  say: ', 'add fifteen dollars of fruit'],
  ['  after: ', '[stage-milk]'],
  ['  call: ', '{ tool: orders_stage_cart, args: { sku: sku-fruit, amountUsd: 15 } }'],
  ['  expect:', ''],
  ['    tool: ', 'orders_stage_cart'],
  ['  fuzz: ', '[asr.number_confusion]'],
  ['  checks: ', '[consent.misheard_amount]'],
] as const;

/** The real test case, the server it plays against, its two variants, and the verdict. */
function TestCase() {
  const fr = useF();
  const w = W('intro');
  const at = w('intro', 8);
  if (fr < at - 4) return null;
  const k = stick(fr, at - 4, { damping: 15, stiffness: 150 });
  const server = w('intro', 18);
  const drop = ramp(fr, w('intro', 15), server + 6, 0, 1);
  const clean = w('intro', 20);
  const misheard = w('intro', 22);
  const fail = w('intro', 24);
  return (
    <>
      <div style={{ position: 'absolute', left: 100, top: 210, width: 1190, transform: `translateX(${(1 - k) * -700}px) rotate(${(1 - k) * -4}deg)`, opacity: Math.min(1, k * 2), borderRadius: 22, background: 'rgba(12,19,36,0.96)', border: '1.5px solid rgba(255,255,255,0.16)', boxShadow: '0 40px 100px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 22px', fontFamily: mono, fontSize: 18, color: C.muted, background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>suites/household-orders.yaml</div>
        <div style={{ padding: '18px 24px', fontFamily: mono, fontSize: 23, lineHeight: 1.55 }}>
          {CASE.map(([key, val], i) => {
            const lit = i === 1 && fr >= w('intro', 12) - 4;
            return (
              <div key={i} style={{ whiteSpace: 'pre', color: C.text, background: lit ? 'rgba(255,170,43,0.16)' : 'transparent', borderRadius: 8, opacity: ramp(fr, at + i * 2, at + i * 2 + 8) }}>
                <span style={{ color: '#7c9bff' }}>{key}</span><span style={{ color: i === 1 ? C.amber : '#c9d1d9' }}>{val}</span>
              </div>
            );
          })}
        </div>
      </div>
      <Pop at={server - 10} x={1610} y={420}>
        <div style={{ width: 330, height: 250, borderRadius: 26, background: 'rgba(142,162,255,0.12)', border: `2px solid ${C.blue}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, boxShadow: fr >= server + 4 ? `0 0 ${60 * Math.exp(-(fr - server - 4) / 20)}px ${C.blue}` : undefined }}>
          <Icon name="server" size={72} color={C.blue} />
          <div style={{ fontFamily: sans, fontSize: 34, fontWeight: 800, color: C.text }}>your server</div>
          <Chip tint={C.blue} style={{ fontSize: 18, padding: '4px 12px' }}>MCP</Chip>
        </div>
      </Pop>
      {drop > 0 && drop < 1 ? (
        <div style={{ position: 'absolute', left: interpolate(drop, [0, 1], [1100, 1450]) - 22, top: interpolate(drop, [0, 1], [410, 420]) - 22 - Math.sin(drop * Math.PI) * 90, width: 44, height: 44, borderRadius: '50%', background: C.amber, boxShadow: '0 0 30px rgba(255,170,43,0.8)' }} />
      ) : null}
      <Lane at={clean - 4} y={690} tint={C.green} label="clean" text={<>heard “add <b>fifteen</b> dollars of fruit” → amountUsd: 15</>} />
      <Lane at={misheard - 4} y={780} tint={C.red} label="misheard" text={<>heard “add <b style={{ color: '#FFB4B2' }}>fifty</b> dollars of fruit” → amountUsd: 50</>} split />
      <Pop at={fail - 2} x={1610} y={640}><div style={{ fontFamily: sans, fontSize: 36, fontWeight: 700, color: C.text, padding: '10px 22px', borderRadius: 16, background: 'rgba(255,255,255,0.08)' }}><Icon name="speaker" size={30} color={C.muted} /> “Added.”</div></Pop>
      <Stamp at={fail + 6} x={1610} y={420} text="Build fails" sub="exit 1" size={58} rot={-8} />
    </>
  );
}

function Lane({ at, y, tint, label, text, split }: { at: number; y: number; tint: string; label: string; text: ReactNode; split?: boolean }) {
  const fr = useF();
  if (fr < at) return null;
  const { k, sx, sy } = squash(fr, at);
  // The misheard lane peels off the clean one: it starts where the clean lane is.
  const dy = split ? (1 - k) * -90 : 0;
  return (
    <div style={{ position: 'absolute', left: 100, top: y + dy, transform: `scale(${sx},${sy})`, transformOrigin: 'left center', display: 'flex', alignItems: 'center', gap: 18, opacity: Math.min(1, k * 3) }}>
      <Chip tint={tint} solid style={{ fontSize: 20, width: 150, justifyContent: 'center' }}>{label}</Chip>
      <div style={{ fontFamily: mono, fontSize: 26, color: C.text }}>{text}</div>
    </div>
  );
}
