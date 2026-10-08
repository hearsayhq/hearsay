/**
 * Film v6's building blocks: one clock per scene, the ink of the scene (paper or night), mask
 * reveals for type, lines that draw themselves, an odometer, the crash-test target, a stamp and a
 * frame for real recordings. Everything is timed in frames from the scene's start.
 */
import { createContext, useContext } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { interpolate, random, useCurrentFrame } from 'remotion';
import { display, EXPO, INK, mono, P, QIN, QIO } from './design';
import type { Mode } from './design';
import { cue } from '../film5/plan';

export const Clock = createContext(0);
export const ModeCtx = createContext<Mode>('paper');
export const useF = () => useCurrentFrame() - useContext(Clock);
export const useInk = () => INK[useContext(ModeCtx)];

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const ramp = (fr: number, a: number, b: number, from = 0, to = 1, easing = EXPO) =>
  interpolate(fr, [a, b], [from, to], { ...clamp, easing });
export const sec = (s: number) => Math.round(s * 60);
/** Word `i` of narration `line`, in frames from the start of `scene`. */
export const cueOf = (scene: string) => (line: string, i: number) => cue(scene, line, i);
/** In and out as one number: 0 before `a`, 1 between, 0 again after `c`. */
export const life = (fr: number, a: number, c?: number, inDur = 18, outDur = 14) =>
  Math.min(ramp(fr, a, a + inDur), c === undefined ? 1 : 1 - ramp(fr, c, c + outDur, 0, 1, QIN));

/** Type that rises out of a mask on `at`, and drops out of it on `out`. */
export function Rise({ at, out, dur = 24, children, style, dist = 108 }: { at: number; out?: number; dur?: number; children: ReactNode; style?: CSSProperties; dist?: number }) {
  const fr = useF();
  const k = ramp(fr, at, at + dur);
  const o = out === undefined ? 0 : ramp(fr, out, out + 18, 0, 1, QIO);
  if (k <= 0) return <span style={{ display: 'inline-block', visibility: 'hidden', ...style }}>{children}</span>;
  return (
    <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', padding: '0.06em 0.04em 0.16em', margin: '-0.06em -0.04em -0.16em', ...style }}>
      <span style={{ display: 'inline-block', transform: `translateY(${(1 - k) * dist - o * dist}%)` }}>{children}</span>
    </span>
  );
}

/** Words that rise one by one, each on its own frame. */
export function Words({ parts, style, gap = '0.26em' }: { parts: Array<[string, number, CSSProperties?]>; style?: CSSProperties; gap?: string }) {
  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: gap, ...style }}>
      {parts.map(([t, at, s], i) => <Rise key={i} at={at} style={s}>{t}</Rise>)}
    </span>
  );
}

/** Absolutely placed block that fades and slides in. */
export function Place({ x, y, at, out, children, dx = 0, dy = 24, style, anchor = 'tl' }: { x: number; y: number; at: number; out?: number; children: ReactNode; dx?: number; dy?: number; style?: CSSProperties; anchor?: 'tl' | 'c' | 'tc' | 'tr' | 'bl' }) {
  const fr = useF();
  const k = ramp(fr, at, at + 26);
  const o = out === undefined ? 1 : 1 - ramp(fr, out, out + 14, 0, 1, QIN);
  if (k <= 0 || o <= 0) return null;
  const tr = { tl: '0,0', c: '-50%,-50%', tc: '-50%,0', tr: '-100%,0', bl: '0,-100%' }[anchor];
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(${tr}) translate(${(1 - k) * dx}px, ${(1 - k) * dy}px)`, opacity: Math.min(k * 1.6, 1) * o, ...style }}>{children}</div>
  );
}

/** A full-frame SVG to draw lines on. */
export const Svg = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', ...style }}>{children}</svg>
);

/** A path that draws itself from `at` over `dur` frames. */
export function Draw({ d, at, dur = 30, stroke, width = 2, out, dash, cap = 'round' }: { d: string; at: number; dur?: number; stroke?: string; width?: number; out?: number; dash?: string; cap?: 'round' | 'butt' }) {
  const fr = useF();
  const ink = useInk();
  const k = ramp(fr, at, at + dur, 0, 1, QIO);
  const o = out === undefined ? 1 : 1 - ramp(fr, out, out + 12);
  if (k <= 0 || o <= 0) return null;
  if (dash) {
    return <path d={d} fill="none" stroke={stroke ?? ink.fg} strokeWidth={width} strokeDasharray={dash} opacity={o} style={{ clipPath: `inset(0 ${(1 - k) * 100}% 0 0)` }} />;
  }
  return <path d={d} pathLength={1} fill="none" stroke={stroke ?? ink.fg} strokeWidth={width} strokeLinecap={cap} strokeDasharray="1 1" strokeDashoffset={1 - k} opacity={o} />;
}

/** A number that rolls up like a meter, digit by digit. */
export function Odometer({ value, at, dur = 60, size, color, weight = 800, font = display, pad = 0, from = 0 }: { value: number; at: number; dur?: number; size: number; color?: string; weight?: number; font?: string; pad?: number; from?: number }) {
  const fr = useF();
  const ink = useInk();
  const v = ramp(fr, at, at + dur, from, value, QIO);
  value = Math.max(value, from);
  const digits = Math.max(String(value).length, pad);
  const cols = [];
  for (let p = digits - 1; p >= 0; p--) {
    const unit = 10 ** p;
    const whole = Math.floor(v / unit);
    const lower = v - whole * unit;
    const roll = p === 0 ? v - Math.floor(v) : Math.max(0, lower - (unit - 1));
    const pos = (whole % 10) + roll;
    // A leading digit opens and closes its own column as the number grows past it or falls below it.
    const show = p === 0 ? 1 : Math.max(0, Math.min(1, v - unit + 1));
    cols.push(
      <span key={p} style={{ display: 'inline-block', height: '1em', width: `${0.62 * show}em`, overflow: 'hidden', lineHeight: 1, opacity: show }}>
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '0.62em', transform: `translateY(${-pos}em)` }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n, i) => <span key={i} style={{ height: '1em' }}>{n}</span>)}
        </span>
      </span>,
    );
  }
  return <span style={{ display: 'inline-flex', fontFamily: font, fontSize: size, fontWeight: weight, color: color ?? ink.fg, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em', lineHeight: 1 }}>{cols}</span>;
}

/**
 * The crash-test target, Hearsay's mark in this film: four quadrants that swing in one after
 * another, inside a ring. `k` 0..1 builds it; `spin` turns it.
 */
export function Target({ size, k = 1, spin = 0, a = P.ink, b = P.orange, ring }: { size: number; k?: number; spin?: number; a?: string; b?: string; ring?: string }) {
  const r = size / 2;
  const q = (i: number) => Math.max(0, Math.min(1, k * 4 - i));
  const wedge = (i: number) => {
    const s = (i * Math.PI) / 2 - Math.PI / 2;
    const e = s + (Math.PI / 2) * q(i);
    const rr = r * 0.78;
    const p0 = [r + rr * Math.cos(s), r + rr * Math.sin(s)];
    const p1 = [r + rr * Math.cos(e), r + rr * Math.sin(e)];
    return `M${r},${r} L${p0[0]},${p0[1]} A${rr},${rr} 0 0 1 ${p1[0]},${p1[1]} Z`;
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: `rotate(${spin}deg)`, overflow: 'visible' }}>
      {/* The ring draws itself, then is drawn solid: a finished dash leaves a hairline seam. */}
      {k * 1.3 >= 1
        ? <circle cx={r} cy={r} r={r - size * 0.03} fill="none" stroke={ring ?? a} strokeWidth={size * 0.04} />
        : <circle cx={r} cy={r} r={r - size * 0.03} fill="none" stroke={ring ?? a} strokeWidth={size * 0.04} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k * 1.3} transform={`rotate(-90 ${r} ${r})`} />}
      {[0, 1, 2, 3].map((i) => q(i) > 0 ? <path key={i} d={wedge(i)} fill={i % 2 ? b : a} /> : null)}
    </svg>
  );
}

/** A verdict, slammed onto the frame: a solid block, its words, and a line of detail. */
export function Stamp({ at, x, y, text, sub, color = P.red, size = 96, out, rot = -3 }: { at: number; x: number; y: number; text: string; sub?: string; color?: string; size?: number; out?: number; rot?: number }) {
  const fr = useF();
  if (fr < at) return null;
  const t = fr - at;
  const s = t < 7 ? interpolate(t, [0, 7], [1.6, 1], { ...clamp, easing: QIN }) : 1 + Math.sin((t - 7) * 0.9) * 0.012 * Math.exp(-(t - 7) / 6);
  const o = out === undefined ? 1 : 1 - ramp(fr, out, out + 12);
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s})`, opacity: Math.min(1, t / 3) * o }}>
      <div style={{ background: color, color: '#fff', padding: `${size * 0.12}px ${size * 0.32}px ${size * 0.14}px`, fontFamily: display, fontWeight: 900, fontSize: size, letterSpacing: '-0.03em', lineHeight: 1, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
        {text}
        {sub ? <div style={{ fontFamily: mono, fontWeight: 500, fontSize: Math.max(16, size * 0.2), letterSpacing: '0.06em', marginTop: size * 0.12, opacity: 0.92, textTransform: 'uppercase' }}>{sub}</div> : null}
      </div>
    </div>
  );
}

/** A small mono label: a square, then the words. */
export const Label = ({ children, color, style, dot }: { children: ReactNode; color?: string; style?: CSSProperties; dot?: string }) => {
  const ink = useInk();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: mono, fontSize: 15, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: color ?? ink.muted, whiteSpace: 'nowrap', ...style }}>
      {dot ? <span style={{ width: 9, height: 9, background: dot, flex: 'none' }} /> : null}
      {children}
    </div>
  );
};

/** A frame around a real recording: its title, and what it is (real run, speed, source). */
export function Window({ x, y, w, h, title, tag, tagColor = P.orange, children, k = 1, style, rx = 0, ry = 0 }: { x: number; y: number; w: number; h: number; title: string; tag?: string; tagColor?: string; children: ReactNode; k?: number; style?: CSSProperties; rx?: number; ry?: number }) {
  const ink = useInk();
  // Floats in: from a tilt and below, settling flat; rx/ry keep a resting tilt.
  const tx = rx + (1 - k) * 14;
  const ty = ry + (1 - k) * -10;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h + 38, background: '#0B0B0A', borderRadius: 10, overflow: 'hidden', border: `1px solid ${ink.bg === P.paper ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.16)'}`, boxShadow: ink.bg === P.paper ? '0 50px 90px -30px rgba(40,30,10,0.45), 0 8px 18px -8px rgba(40,30,10,0.25)' : '0 60px 140px -30px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.03)', transform: `perspective(2600px) translateY(${(1 - k) * 90}px) rotateX(${tx}deg) rotateY(${ty}deg) scale(${0.94 + 0.06 * k})`, opacity: Math.min(1, k * 2), ...style }}>
      <div style={{ height: 38, display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#141413' }}>
        <span style={{ display: 'flex', gap: 7 }}>{[0, 1, 2].map((i) => <span key={i} style={{ width: 11, height: 11, borderRadius: 6, background: 'rgba(255,255,255,0.16)' }} />)}</span>
        <span style={{ fontFamily: mono, fontSize: 14, color: 'rgba(236,232,223,0.6)', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden' }}>{title}</span>
        {tag ? <span style={{ marginLeft: 'auto', fontFamily: mono, fontSize: 13, fontWeight: 600, letterSpacing: '0.14em', color: tagColor, whiteSpace: 'nowrap' }}>● {tag}</span> : null}
      </div>
      {children}
    </div>
  );
}

/** Film grain, so the paper reads as paper: a fresh noise every other frame. */
export function Grain({ opacity = 0.07 }: { opacity?: number }) {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 97;
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'multiply', opacity }}>
      <filter id={`g${seed}`}><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="1920" height="1080" filter={`url(#g${seed})`} />
    </svg>
  );
}

export type Rect = { x: number; y: number; w: number; h: number };
/**
 * One shape becoming another across a cut: a rectangle that moves and resizes from `from` to `to`
 * between frames a and b, then fades as what it became takes over.
 */
export function Morph({ from, to, a, b, fadeAt, border, fill, radius = 0, z = 8 }: { from: Rect; to: Rect; a: number; b: number; fadeAt?: number; border?: string; fill?: string; radius?: number; z?: number }) {
  const fr = useF();
  const k = ramp(fr, a, b, 0, 1, QIO);
  const o = fadeAt === undefined ? 1 : 1 - ramp(fr, fadeAt, fadeAt + 12);
  if (fr < a || o <= 0) return null;
  const L = (p: keyof Rect) => from[p] + (to[p] - from[p]) * k;
  return <div style={{ position: 'absolute', left: L('x'), top: L('y'), width: L('w'), height: L('h'), border: border ? `3px solid ${border}` : 'none', background: fill ?? 'transparent', borderRadius: radius, opacity: o, zIndex: z, boxSizing: 'border-box' }} />;
}

/** A disc of colour, centred on (x, y), radius r: for irises and floods. */
export const Disc = ({ x, y, r, color, z = 8, opacity = 1 }: { x: number; y: number; r: number; color: string; z?: number; opacity?: number }) =>
  r > 0 && opacity > 0 ? <div style={{ position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', background: color, zIndex: z, opacity }} /> : null;

type Shot = { x: number; y: number; s: number };
/**
 * A camera over a page: keys of [frame, focus point and zoom]; between keys it moves on QIO.
 * At { x: 960, y: 517, s: 1 } the page sits as drawn.
 */
export function Cam({ keys, children }: { keys: Array<[number, Shot]>; children: ReactNode }) {
  const fr = useF();
  let v = keys[0]![1];
  for (let i = 1; i < keys.length; i++) {
    const [f0, a] = keys[i - 1]!;
    const [f1, b] = keys[i]!;
    if (fr >= f1) { v = b; continue; }
    if (fr > f0) { const k = QIO((fr - f0) / Math.max(1, f1 - f0)); v = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, s: Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * k) }; }
    break;
  }
  return <div style={{ position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `translate(${960 - v.x * v.s}px, ${517 - v.y * v.s}px) scale(${v.s})` }}>{children}</div>;
}
export const HOME: Shot = { x: 960, y: 517, s: 1 };

/** A deterministic jitter in -1..1 for frame-to-frame life. */
export const jitter = (key: string, frame: number) => random(`${key}-${frame}`) * 2 - 1;

/** A highlight on a line of a recording, in the recording's own pixels: an outline that draws across. */
export function Hi({ at, out, x, y, w, h, color = P.orange, stroke = 8 }: { at: number; out?: number; x: number; y: number; w: number; h: number; color?: string; stroke?: number }) {
  const fr = useF();
  if (fr < at) return null;
  const k = ramp(fr, at, at + 16, 0, 1, QIO);
  const o = out === undefined ? 1 : 1 - ramp(fr, out, out + 10);
  if (o <= 0) return null;
  return <div style={{ position: 'absolute', left: x - 14, top: y - 8, width: (w + 28) * k, height: h + 16, border: `${stroke}px solid ${color}`, background: `${color}24`, opacity: o }} />;
}
