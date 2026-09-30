/** Cold open (a generated still, real voices and a real run's numbers), intro and what-it-is. */
import { Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { VoicePill } from '../glass/VoicePill';
import { c, sans } from '../theme';
import { linesOf, type Line } from './plan';
import { Tag } from './frames';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const TINT = { customer: c.amber, addon: '#7FE0C7', narrator: '#8B95A9' } as const;

/** The voice indicator for whoever is speaking in a scene. */
export function Speaking({ lines, x, y }: { lines: Record<string, Line>; x: number; y: number }) {
  const f = useCurrentFrame();
  const now = Object.values(lines).find((l) => f >= l.at && f < l.to);
  return now ? (
    <Sequence from={now.at} durationInFrames={now.to - now.at} layout="none">
      <VoicePill src={now.src} tint={TINT[now.who]} x={x} y={y} />
    </Sequence>
  ) : (
    <VoicePill tint="#5b6b8c" x={x} y={y} />
  );
}

const K = linesOf('cold');
export function Cold() {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const push = interpolate(f, [0, durationInFrames], [1.02, 1.12]);
  const heard = interpolate(f, [K['k-c1']!.to, K['k-c1']!.to + 12], [0, 1], clamp);
  const placed = interpolate(f, [K['k-a4']!.at + 20, K['k-a4']!.at + 34], [0, 1], clamp);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <Img src={staticFile('broll/kitchen-evening.png')} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${push}) translateX(${interpolate(f, [0, durationInFrames], [0, -20])}px)` }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,16,32,0.25), rgba(10,16,32,0.1) 45%, rgba(10,16,32,0.85))' }} />
      <div style={{ transform: 'scale(0.62)', transformOrigin: '960px 820px' }}><Speaking lines={K} x={960} y={820} /></div>
      <Tag style={{ left: 80, top: 80, opacity: heard, fontSize: 24 }}>heard → “add fifty dollars of fruit”</Tag>
      <Tag tint="#ff8a80" style={{ left: 80, top: 136, opacity: placed, fontSize: 24 }}>order placed · $50.00 · after a “No!”</Tag>
      <Tag tint={c.muted} style={{ right: 80, top: 80, opacity: heard, fontSize: 16 }}>grocery add-on, flawed build · replies from a real run</Tag>
    </div>
  );
}

const I = linesOf('intro');
export function Intro3() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t0 = spring({ frame: f - I.i0!.at, fps, config: { damping: 18 } });
  const dots = interpolate(f, [I.i1!.at - 10, I.i1!.at + 20], [0, 1], clamp);
  const count = Math.round(interpolate(f, [I.i1!.at, I.i1!.at + 150], [0, 21798], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const you = spring({ frame: f - (I.i1!.to - 40), fps, config: { damping: 14 } });
  const last = spring({ frame: f - I.i3!.at, fps, config: { damping: 18 } });
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: sans, color: c.text }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 440, textAlign: 'center', fontSize: 64, fontWeight: 800, letterSpacing: -1.5, opacity: t0 * (1 - dots) }}>That add-on works perfectly<br />in a chat window.</div>
      <div style={{ opacity: dots * (1 - last) }}>
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          {Array.from({ length: 64 * 26 }, (_, i) => {
            const col = i % 64;
            const row = Math.floor(i / 64);
            const born = I.i1!.at + ((col * 7 + row * 13) % 90) * 1.4;
            const isYou = col === 41 && row === 15;
            return <circle key={i} cx={160 + col * 25.4} cy={330 + row * 21} r={isYou ? 3.2 + you * 10 : 3.2} fill={isYou && you > 0.05 ? c.amber : '#5b6b8c'} opacity={interpolate(f, [born, born + 12], [0, 1], clamp) * (isYou ? 1 : 0.55)} />;
          })}
        </svg>
        <div style={{ position: 'absolute', left: 160, top: 130 }}>
          <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: -4, fontVariantNumeric: 'tabular-nums' }}>{count.toLocaleString('en-US')}</div>
          <div style={{ fontSize: 24, color: c.muted }}>signed up for this hackathon · Devpost, 30 Sep 2026</div>
        </div>
        <div style={{ position: 'absolute', left: 160 + 41 * 25.4 + 26, top: 330 + 15 * 21 - 20, opacity: you, fontSize: 30, fontWeight: 700, color: c.amber }}>← you</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 470, textAlign: 'center', fontSize: 70, fontWeight: 800, letterSpacing: -1.5, opacity: last }}>So I built something for you.</div>
    </div>
  );
}

const W = linesOf('what');
export function What3() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = spring({ frame: f - W.w1!.at, fps, config: { damping: 18 } });
  const line = interpolate(f, [W.w1!.at + 40, W.w1!.at + 70], [0, 1], clamp);
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: sans, color: c.text }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 200, textAlign: 'center', fontSize: 190, fontWeight: 800, letterSpacing: 14, opacity: k, transform: `translateY(${(1 - k) * 30}px)` }}>HEARSAY</div>
      <div style={{ opacity: k }}><Speaking lines={W} x={960} y={540} /></div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 660, textAlign: 'center', opacity: line }}>
        <div style={{ fontSize: 46, fontWeight: 600 }}>Preflight checks for Alexa+ MCP servers</div>
        <div style={{ fontSize: 24, color: c.muted, marginTop: 12 }}>Unofficial · open source</div>
      </div>
    </div>
  );
}
