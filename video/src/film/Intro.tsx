/** 0:00 — 21,798 sign-ups become a field of dots; one lights up: you. Then the wordmark. */
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { VoicePill } from '../glass/VoicePill';
import { c, sans } from '../theme';
import { linesOf } from './timeline';

const L = linesOf('intro');
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const COLS = 64;
const ROWS = 30;

export function Intro() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const count = Math.round(interpolate(f, [L.i1!.at, L.i1!.to], [0, 21798], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const sweep = interpolate(f, [L.i2!.at, L.i2!.at + 90], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const you = spring({ frame: f - (L.i2!.to - 40), fps, config: { damping: 14 } });
  const focus = interpolate(f, [L.i3!.at, L.i3!.to + 10], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const YOU = { col: 41, row: 17 };
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: 1 - focus * 0.85 }}>
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const born = L.i1!.at + ((col * 7 + row * 13) % 90) * 1.6;
          const o = interpolate(f, [born, born + 12], [0, 1], clamp);
          const x = 160 + col * 25.4;
          const y = 300 + row * 21;
          const lit = Math.max(0, 1 - Math.abs(x - (160 + sweep * 1640)) / 60);
          const isYou = col === YOU.col && row === YOU.row;
          return <circle key={i} cx={x} cy={y} r={isYou ? 4 + you * 10 : 3.2} fill={isYou && you > 0.05 ? c.amber : lit > 0 ? c.amber : '#5b6b8c'} opacity={o * (isYou ? 1 : 0.55 + lit * 0.45)} />;
        })}
      </svg>
      <div style={{ position: 'absolute', left: 160, top: 120, fontFamily: sans, color: c.text, opacity: 1 - focus }}>
        <div style={{ fontSize: 132, fontWeight: 800, letterSpacing: -4, fontVariantNumeric: 'tabular-nums' }}>{count.toLocaleString('en-US')}</div>
        <div style={{ fontSize: 26, color: c.muted, marginTop: -6 }}>people signed up for this hackathon · Devpost, 30 Sep 2026</div>
      </div>
      <div style={{ position: 'absolute', left: 160 + YOU.col * 25.4 + 26, top: 300 + YOU.row * 21 - 22, opacity: you * (1 - focus), fontFamily: sans, fontSize: 30, fontWeight: 700, color: c.amber }}>← you</div>
    </div>
  );
}

const W = linesOf('what');

export function What() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const word = spring({ frame: f - (W.w1!.at - 10), fps, config: { damping: 18 } });
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 170, textAlign: 'center', fontFamily: sans, fontSize: 196, fontWeight: 800, letterSpacing: 14, color: c.text, opacity: word, transform: `translateY(${(1 - word) * 30}px)` }}>HEARSAY</div>
      <div style={{ opacity: word }}>
        <VoicePill src={W.w1!.src} tint={c.amber} x={960} y={500} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 620, textAlign: 'center', fontFamily: sans }}>
        {['Write what your customers say.', 'Hearsay plays it against your add-on, mishearings included,', 'and fails the build when it would sound wrong.'].map((t, i) => {
          const at = W.w1!.at + (W.w1!.to - W.w1!.at) * [0.22, 0.45, 0.72][i]!;
          return <div key={t} style={{ fontSize: 40, fontWeight: i === 0 ? 700 : 500, color: i === 2 ? c.amber : c.text, marginTop: 8, opacity: interpolate(f, [at, at + 15], [0, 1], clamp) }}>{t}</div>;
        })}
      </div>
    </div>
  );
}
