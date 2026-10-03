/**
 * The motion kit of film v4: sticky springs (one overshoot, then they hold), stamps, starbursts,
 * gooey blobs, and a terminal window whose camera moves inside a real recording.
 */
import type { CSSProperties, ReactNode } from 'react';
import { createContext, useContext } from 'react';
import { Easing, Freeze, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame } from 'remotion';
import { c, FPS, mono, sans } from '../theme';

export const C = { ...c, blue: '#8EA2FF', blueSoft: 'rgba(142,162,255,0.14)', redSoft: 'rgba(255,94,91,0.16)', greenSoft: 'rgba(61,220,151,0.14)', ink0: '#060A14' } as const;

/** The gradient of the brand: amber into pink into violet. */
export const GRAD = 'linear-gradient(90deg, #FFB23F 0%, #FF5E8A 52%, #8B6BFF 100%)';
export const GRAD_TEXT: CSSProperties = { backgroundImage: GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
/** The voice as a sphere of light. */
export const ORB = 'radial-gradient(circle at 34% 28%, #FFE1B0 0%, #FFB23F 30%, #FF5E8A 66%, #8B6BFF 100%)';
/** Tinted glass over the gradients. */
export const GLASS: CSSProperties = { background: 'rgba(12,15,30,0.62)', border: '1px solid rgba(255,255,255,0.14)', boxShadow: '0 30px 80px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.10)' };
export { mono, sans };
export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const OUT = Easing.bezier(0.22, 1, 0.36, 1);
export const INOUT = Easing.bezier(0.65, 0, 0.35, 1);

/** Frame of the current scene: 0 is the scene's start; negative while the camera arrives. */
export const SceneClock = createContext(0);
export const useF = () => useCurrentFrame() - useContext(SceneClock);

/** A sticky spring: quick, one overshoot, then it holds. */
export const stick = (fr: number, at: number, cfg: { damping?: number; stiffness?: number; mass?: number } = {}) =>
  spring({ frame: fr - at, fps: FPS, config: { damping: cfg.damping ?? 11, stiffness: cfg.stiffness ?? 190, mass: cfg.mass ?? 0.6 } });
/** A calm spring with no visible overshoot. */
export const settle = (fr: number, at: number, stiffness = 140) => spring({ frame: fr - at, fps: FPS, config: { damping: 26, stiffness, mass: 0.8 } });
export const ramp = (fr: number, a: number, b: number, from = 0, to = 1, easing = OUT) => interpolate(fr, [a, b], [from, to], { ...clamp, easing });
export const sec = (s: number) => Math.round(s * FPS);

/** Stretch along the motion, squash when it lands. */
export function squash(fr: number, at: number, amount = 1.6) {
  const k = stick(fr, at);
  const v = k - stick(fr - 1, at);
  return { k, sx: 1 + v * amount, sy: 1 - v * amount };
}

/** Pops in at `at` (sticky), optionally leaves at `out`. Positioned by its centre. */
export function Pop({ at, out, x, y, rot = 0, from = 0.3, children, style, z }: { at: number; out?: number; x: number; y: number; rot?: number; from?: number; children: ReactNode; style?: CSSProperties; z?: number }) {
  const fr = useF();
  if (fr < at) return null;
  const { k, sx, sy } = squash(fr, at);
  const o = out === undefined ? 1 : ramp(fr, out, out + 9, 1, 0, Easing.in(Easing.cubic));
  if (o <= 0) return null;
  const s = (from + (1 - from) * k) * (out === undefined ? 1 : 0.6 + 0.4 * o);
  return (
    <div style={{ position: 'absolute', left: x, top: y, zIndex: z, transform: `translate(-50%,-50%) rotate(${rot + (1 - k) * 10}deg) scale(${s * sx},${s * sy})`, opacity: Math.min(1, k * 2.5) * o, ...style }}>
      {children}
    </div>
  );
}

/** A rubber stamp that slams in with a ring. */
export function Stamp({ at, x, y, text, color = C.red, size = 64, rot = -8, sub, out }: { at: number; x: number; y: number; text: string; color?: string; size?: number; rot?: number; sub?: string; out?: number }) {
  const fr = useF();
  if (fr < at) return null;
  const gone = out === undefined ? 0 : ramp(fr, out, out + 10);
  if (gone >= 1) return null;
  const k = spring({ frame: fr - at, fps: FPS, config: { damping: 13, stiffness: 320, mass: 0.9 } });
  const s = interpolate(k, [0, 1], [2.4, 1]);
  const ring = ramp(fr, at + 4, at + 26);
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s * (1 - gone * 0.4)})`, opacity: Math.min(1, k * 2) * (1 - gone), zIndex: 30 }}>
      <div style={{ position: 'absolute', inset: -14, border: `3px solid ${color}`, borderRadius: 18, opacity: (1 - ring) * 0.7, transform: `scale(${1 + ring * 0.35})` }} />
      <div style={{ fontFamily: sans, fontWeight: 900, fontSize: size, letterSpacing: size * 0.02, color, border: `${Math.max(4, size / 12)}px solid ${color}`, borderRadius: 14, padding: `${size * 0.08}px ${size * 0.28}px`, background: 'rgba(8,10,22,0.80)', whiteSpace: 'nowrap', textTransform: 'uppercase', lineHeight: 1.05, boxShadow: `0 0 60px ${color}44` }}>
        {text}
        {sub ? <div style={{ fontSize: size * 0.3, fontWeight: 700, letterSpacing: 1, textTransform: 'none', opacity: 0.9, marginTop: 4 }}>{sub}</div> : null}
      </div>
    </div>
  );
}

/** A small rounded label. */
export const Chip = ({ children, tint = C.amber, solid = false, style }: { children: ReactNode; tint?: string; solid?: boolean; style?: CSSProperties }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: mono, fontSize: 22, fontWeight: 500, color: solid ? C.ink : tint, background: solid ? tint : 'rgba(10,13,26,0.72)', border: `1.5px solid ${tint}`, borderRadius: 999, padding: '8px 18px', whiteSpace: 'nowrap', ...style }}>{children}</div>
);

/** An infomercial starburst. */
export function Starburst({ size, points = 20, inner = 0.8, fill = C.amber, spin = 0, children, style }: { size: number; points?: number; inner?: number; fill?: string | 'grad'; spin?: number; children?: ReactNode; style?: CSSProperties }) {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? 50 : 50 * inner;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`);
  }
  return (
    <div style={{ position: 'relative', width: size, height: size, ...style }}>
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, transform: `rotate(${spin}deg)`, filter: `drop-shadow(0 10px 30px ${fill === 'grad' ? '#FF5E8A' : fill}55)` }}>
        <defs><linearGradient id="burst" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFB23F" /><stop offset="0.55" stopColor="#FF5E8A" /><stop offset="1" stopColor="#8B6BFF" /></linearGradient></defs>
        <polygon points={pts.join(' ')} fill={fill === 'grad' ? 'url(#burst)' : fill} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>{children}</div>
    </div>
  );
}

/** The goo: blur, then a hard alpha threshold, so nearby blobs melt into one. */
export const GooDefs = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }}>
    <defs>
      <filter id="goo" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="b" />
        <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -12" result="g" />
        <feComposite in="SourceGraphic" in2="g" operator="atop" />
      </filter>
      <filter id="goo-text" x="-10%" y="-40%" width="120%" height="180%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b" />
        <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" />
      </filter>
    </defs>
  </svg>
);

/** Simple line icons on a 24 grid. */
const PATHS: Record<string, string> = {
  mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3M8 21h8',
  model: 'M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z',
  server: 'M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01M12 7h5M12 17h5',
  speaker: 'M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12',
  key: 'M14 10a4 4 0 1 0-1.2 2.8L20 20M17 17l2-2M15 15l2-2',
  lock: 'M6 11h12v10H6zM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11',
  plug: 'M9 2v5M15 2v5M6 7h12v3a6 6 0 0 1-12 0zM12 16v6',
  check: 'M4 12.5l5 5L20 6.5',
  x: 'M6 6l12 12M18 6L6 18',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  file: 'M6 2h8l4 4v16H6zM14 2v4h4',
  agent: 'M9 3h6M12 3v3M5 6h14v12H5zM9 11h.01M15 11h.01M9 15h6',
  pr: 'M6 3v12M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM6 3a3 3 0 1 0 0 0zM18 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 15V9a3 3 0 0 0-3-3h-4M13 4l-2 2 2 2',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 3',
};
export const Icon = ({ name, size = 48, color = C.text, stroke = 2 }: { name: keyof typeof PATHS | string; size?: number; color?: string; stroke?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"><path d={PATHS[name] ?? ''} /></svg>
);

/** A region of a recording in source pixels. */
export type View = { x: number; y: number; w: number };
/** Eased path through views: [frame, view] keys. */
export function track(fr: number, keys: Array<[number, View]>): View {
  if (fr <= keys[0]![0]) return keys[0]![1];
  for (let i = 1; i < keys.length; i++) {
    const [f1, v1] = keys[i]!;
    const [f0, v0] = keys[i - 1]!;
    if (fr <= f1) {
      const p = INOUT((fr - f0) / Math.max(1, f1 - f0));
      // Zoom moves in log space so it feels even.
      const w = Math.exp(Math.log(v0.w) + (Math.log(v1.w) - Math.log(v0.w)) * p);
      return { x: v0.x + (v1.x - v0.x) * p, y: v0.y + (v1.y - v0.y) * p, w };
    }
  }
  return keys[keys.length - 1]![1];
}

type ClipInfo = { src: string; w: number; h: number; seconds: number };

/**
 * A real recording seen through a viewport of `vw` x `vh` pixels. `t` is the recording's own
 * time in seconds (held on the last frame past its end); `view` is the part of the recording in
 * view; children are drawn in recording pixels, so marks stay on their line.
 */
export function Rec({ clip, t, view, vw, vh, children }: { clip: ClipInfo; t: number; view: View; vw: number; vh: number; children?: ReactNode }) {
  const k = vw / view.w;
  const time = Math.max(0, Math.min(t, clip.seconds - 0.05));
  return (
    <div style={{ position: 'relative', width: vw, height: vh, overflow: 'hidden', background: '#0a1020' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: clip.w, height: clip.h, transformOrigin: '0 0', transform: `translate(${-view.x * k}px, ${-view.y * k}px) scale(${k})` }}>
        <Freeze frame={Math.round(time * FPS)}>
          <OffthreadVideo src={staticFile(clip.src)} muted style={{ position: 'absolute', left: 0, top: 0, width: clip.w, height: clip.h }} />
        </Freeze>
        {children}
      </div>
    </div>
  );
}

/** A highlighter swipe over a line of a recording, in recording pixels. */
export function Mark({ at, x, y, w, h, color = C.amber, out }: { at: number; x: number; y: number; w: number; h: number; color?: string; out?: number }) {
  const fr = useF();
  if (fr < at) return null;
  const k = ramp(fr, at, at + 14);
  const o = out === undefined ? 1 : ramp(fr, out, out + 10, 1, 0);
  return <div style={{ position: 'absolute', left: x - 12, top: y - 6, width: (w + 24) * k, height: h + 12, borderRadius: 10, background: `${color}2e`, border: `3px solid ${color}`, boxShadow: `0 0 40px ${color}55`, opacity: o }} />;
}

/** A terminal window: title bar and a recording inside. */
export function TermWindow({ title, w, h, children, glow = C.amber, style }: { title: string; w: number; h: number; children: ReactNode; glow?: string; style?: CSSProperties }) {
  return (
    <div style={{ position: 'absolute', width: w, height: h + 44, borderRadius: 18, overflow: 'hidden', background: '#0a1020', border: '1px solid rgba(255,255,255,0.20)', boxShadow: `0 60px 160px rgba(0,0,0,0.6), 0 0 140px ${glow}33, inset 0 1px 0 rgba(255,255,255,0.12)`, ...style }}>
      <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 9, padding: '0 18px', background: 'linear-gradient(180deg, #161d33, #10162a)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((col) => <span key={col} style={{ width: 13, height: 13, borderRadius: 7, background: col }} />)}
        <span style={{ margin: '0 auto', fontFamily: mono, fontSize: 17, color: '#8b949e' }}>{title}</span>
        <span style={{ width: 60 }} />
      </div>
      {children}
    </div>
  );
}

/** A label on screen that names what a recording shows: speed, take, source. */
export const RecLabel = ({ children, tint = C.text, style }: { children: ReactNode; tint?: string; style?: CSSProperties }) => (
  <div style={{ position: 'absolute', fontFamily: mono, fontSize: 19, fontWeight: 500, letterSpacing: 1, color: tint, background: 'rgba(10,13,26,0.80)', border: `1.5px solid ${tint}88`, borderRadius: 8, padding: '6px 12px', textTransform: 'uppercase', whiteSpace: 'nowrap', ...style }}>{children}</div>
);
