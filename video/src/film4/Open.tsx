/**
 * The first two scenes: what Hearsay is, shown with a real test case of
 * suites/household-orders.yaml, and why voice needs it: four ways add-ons break out loud.
 */
import type { ReactNode } from 'react';
import { interpolate } from 'remotion';
import { cue, sceneFrames } from './plan';
import { C, Chip, clamp, GLASS, GRAD, GRAD_TEXT, Icon, mono, ORB, Pop, ramp, sans, squash, Stamp, Starburst, stick, useF } from './kit';

const W = (scene: string) => (line: string, i: number) => cue(scene, line, i);

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

/** Frame one: a drop of sound hits and rings out. */
function Shock() {
  const fr = useF();
  if (fr > 70) return null;
  const rings = [0, 8, 16];
  return (
    <>
      {rings.map((d) => {
        const p = ramp(fr, d, d + 46);
        return <div key={d} style={{ position: 'absolute', left: 960 - 700 * p, top: 430 - 700 * p, width: 1400 * p, height: 1400 * p, borderRadius: '50%', border: `${3 + 6 * (1 - p)}px solid rgba(255,140,120,${0.55 * (1 - p)})` }} />;
      })}
    </>
  );
}

const CARDS = [
  { x: 440, y: 250, word: 12, rot: -4 },
  { x: 1480, y: 250, word: 16, rot: 3 },
  { x: 440, y: 720, word: 22, rot: 3 },
  { x: 1480, y: 720, word: 28, rot: -3 },
] as const;
const LIST = ['milk', 'eggs', 'bread', 'fruit', 'oat milk', 'butter', 'rice', 'tea', 'jam', 'flour', 'soap', 'coffee'];

function Card({ i, children, label }: { i: number; children: ReactNode; label: string }) {
  const fr = useF();
  const w = W('prob');
  const card = CARDS[i]!;
  const at = w('why', card.word) + 6;
  const D = sceneFrames('prob');
  const suck = ramp(fr, D - 34 + i * 3, D - 12 + i * 3, 0, 1, (t) => t * t);
  if (fr < at || suck >= 1) return null;
  const { k, sx, sy } = squash(fr, at);
  const x = interpolate(k, [0, 1], [960, card.x], clamp) * (1 - suck) + 960 * suck;
  const y = interpolate(k, [0, 1], [470, card.y], clamp) * (1 - suck) + 470 * suck;
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${card.rot * k}deg) scale(${(0.2 + 0.8 * k) * sx * (1 - suck)},${(0.2 + 0.8 * k) * sy * (1 - suck)})`, width: 600, padding: '28px 32px', borderRadius: 26, ...GLASS, border: '1.5px solid rgba(255,120,120,0.45)' }}>
      <div style={{ minHeight: 110, display: 'flex', alignItems: 'center' }}>{children}</div>
      <div style={{ marginTop: 14, fontFamily: sans, fontSize: 30, fontWeight: 800, color: C.text }}>{label}</div>
    </div>
  );
}

export function Prob() {
  const fr = useF();
  const w = (i: number) => cue('prob', 'why', i);
  const D = sceneFrames('prob');
  const enter = stick(fr, -10, { damping: 15, stiffness: 140 });
  const loud = ramp(fr, w(7), w(7) + 20);
  const crack = fr >= w(10);
  const crackK = ramp(fr, w(10), w(10) + 10);
  const shake = crack ? Math.exp(-(fr - w(10)) / 7) * Math.sin(fr * 2.2) * 9 : 0;
  const ww = interpolate(loud, [0, 1], [660, 250]);
  const hh = interpolate(loud, [0, 1], [420, 250]);
  const swallow = ramp(fr, D - 30, D - 4, 0, 1);
  const lines = [
    { who: 'you typed', text: 'Add $15 of fruit', at: w(2) },
    { who: 'add-on', text: 'Added $15 of fruit.', at: w(3) + 10 },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', left: 960 + shake - ww / 2, top: 470 - hh / 2, width: ww, height: hh, borderRadius: interpolate(loud, [0, 1], [28, 125]), ...(loud > 0 ? { background: ORB } : GLASS), border: `1.5px solid ${loud > 0.5 ? 'transparent' : 'rgba(255,255,255,0.18)'}`, boxShadow: loud > 0.5 ? `0 0 ${80 + 60 * swallow}px rgba(255,120,110,0.55)` : '0 40px 100px rgba(0,0,0,0.45)', overflow: 'hidden', transform: `scale(${(0.7 + 0.3 * enter) * (1 + swallow * 0.35)})`, opacity: Math.min(1, enter * 2) }}>
        <div style={{ opacity: 1 - ramp(fr, w(7) - 4, w(7) + 6), padding: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: mono, fontSize: 18, color: C.muted, marginBottom: 26, letterSpacing: 2 }}>CHAT WINDOW</div>
          {lines.map((l) => fr >= l.at ? (
            <div key={l.text} style={{ display: 'flex', justifyContent: l.who === 'add-on' ? 'flex-start' : 'flex-end', marginBottom: 18, opacity: ramp(fr, l.at, l.at + 8) }}>
              <div style={{ fontFamily: sans, fontSize: 34, fontWeight: 600, color: C.text, padding: '12px 22px', borderRadius: 18, background: l.who === 'add-on' ? 'rgba(255,255,255,0.08)' : 'rgba(142,162,255,0.22)' }}>{l.text}</div>
            </div>
          ) : null)}
        </div>
        {crack ? (
          <svg viewBox="0 0 250 250" style={{ position: 'absolute', inset: 0, opacity: crackK }}>
            <path d="M125 10 L112 80 L140 118 L104 168 L126 240 M140 118 L205 104 M112 80 L52 66 M104 168 L40 190" stroke="#2a0a14" strokeWidth={5} fill="none" strokeDasharray={600} strokeDashoffset={600 * (1 - crackK)} />
          </svg>
        ) : null}
      </div>
      <Stamp at={w(6)} x={1260} y={250} text="Looks fine" color={C.green} size={54} rot={6} out={w(7)} />
      <Pop at={w(7)} x={960} y={470 + 185} out={w(12) - 2}>
        <div style={{ fontFamily: sans, fontSize: 56, fontWeight: 900, color: C.text }}>Out loud…</div>
      </Pop>
      <Card i={0} label="A number heard wrong">
        <div>
          <div style={{ fontFamily: mono, fontSize: 20, color: C.muted, marginBottom: 6 }}>SAID fifteen · HEARD</div>
          <div style={{ fontFamily: sans, fontSize: 64, fontWeight: 800, color: C.text }}><Melt from="fifteen" to="fifty" at={w(13)} size={64} color={C.text} weight={800} /></div>
        </div>
      </Card>
      <Card i={1} label="A reply that reads out JSON">
        <div style={{ fontFamily: mono, fontSize: 30, color: '#FFB4B2', lineHeight: 1.35 }}>{'{"sku":"sku-fruit",'}<br />{' "amountUsd":50}'}</div>
      </Card>
      <Card i={2} label="A list too long to remember">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {LIST.slice(0, Math.min(LIST.length, 1 + Math.floor(Math.max(0, fr - w(22)) / 4))).map((x) => <span key={x} style={{ fontFamily: sans, fontSize: 22, fontWeight: 600, color: C.text, background: 'rgba(255,255,255,0.08)', padding: '4px 12px', borderRadius: 999 }}>{x}</span>)}
        </div>
      </Card>
      <Card i={3} label="A no that still places the order">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontFamily: sans, fontSize: 40, fontWeight: 800, color: C.text }}>
          <span style={{ fontSize: 30, color: C.ink, background: C.red, padding: '6px 22px', borderRadius: 12 }}>No</span>
          <span style={{ color: C.muted }}>→</span>
          <span style={{ color: '#FFB4B2' }}>order placed</span>
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
  // A drop of sound lands on frame one and becomes the word.
  const arrive = stick(fr, 0, { damping: 9, stiffness: 170 });
  const orbX = 960;
  const orbY = 430;
  const flat = ramp(fr, hit - 6, hit + 6);
  const shrink = stick(fr, w('intro', 8) - 4, { damping: 16, stiffness: 150 });
  // The wordmark moves to the corner when the test case comes in.
  const mark = { x: interpolate(shrink, [0, 1], [960, 300]), y: interpolate(shrink, [0, 1], [430, 120]), s: interpolate(shrink, [0, 1], [1, 0.34]) };
  const tag = ['Preflight', 'checks', 'for', 'voice', 'add-ons'];
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Shock />
      {fr < hit + 8 && fr >= 0 ? (
        <div style={{ position: 'absolute', left: orbX - interpolate(flat, [0, 1], [125 * (1 + 0.04 * Math.sin(fr / 5)), 460]), top: orbY - interpolate(flat, [0, 1], [125, 8]) + flat * 130, width: interpolate(flat, [0, 1], [250 * (1 + 0.04 * Math.sin(fr / 5)), 920]), height: interpolate(flat, [0, 1], [250, 16]), borderRadius: 125, background: ORB, boxShadow: '0 0 120px rgba(255,110,140,0.5)', transform: `scale(${arrive})` }} />
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
        {fr >= hit ? <div style={{ position: 'absolute', left: '50%', bottom: -14, height: 18, borderRadius: 9, background: GRAD, width: `${100 * stick(fr, hit, { damping: 18 })}%`, transform: 'translateX(-50%)', boxShadow: '0 0 60px rgba(255,94,138,0.55)' }} /> : null}
      </div>
      {fr >= hit + 10 && fr < w('intro', 8) + 20 ? (
        <div style={{ position: 'absolute', left: 1590, top: 205, transform: `translate(-50%,-50%) scale(${stick(fr, hit + 10) * (1 - ramp(fr, w('intro', 8) - 4, w('intro', 8) + 12))})` }}>
          <Starburst size={270} spin={fr * 0.25} points={22} fill="grad">
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
            return <span key={t} style={{ fontFamily: sans, fontSize: 60, fontWeight: 700, color: C.text, ...(i === 3 ? GRAD_TEXT : {}), opacity: Math.min(1, k * 2), transform: `translateY(${(1 - k) * 40}px)`, display: 'inline-block' }}>{t}</span>;
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
      <div style={{ position: 'absolute', left: 100, top: 210, width: 1190, transform: `translateX(${(1 - k) * -700}px) rotate(${(1 - k) * -4}deg)`, opacity: Math.min(1, k * 2), borderRadius: 22, ...GLASS, background: 'rgba(10,13,26,0.78)', overflow: 'hidden' }}>
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
        <div style={{ width: 330, height: 250, borderRadius: 26, background: 'rgba(110,130,255,0.16)', border: `2px solid ${C.blue}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, boxShadow: fr >= server + 4 ? `0 0 ${60 * Math.exp(-(fr - server - 4) / 20)}px ${C.blue}` : undefined }}>
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
