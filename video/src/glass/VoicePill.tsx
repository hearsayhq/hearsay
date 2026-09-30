/**
 * The voice indicator: a liquid-glass pill that wakes only while someone speaks. Driven by the
 * real audio (Remotion's spectrum of the file), mirrored from the middle, drawn behind the glass,
 * so the glass bends light and bars, never text. Without `src` it idles.
 */
import { useAudioData, visualizeAudio } from '@remotion/media-utils';
import { staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { LiquidGlass } from './LiquidGlass';

const HALF = 20;

function Bars({ values, w, h, tint }: { values: number[]; w: number; h: number; tint: string }) {
  const bars = [...values.slice(0, HALF).reverse(), ...values.slice(0, HALF)];
  return (
    <svg width={w} height={h} style={{ position: 'absolute', inset: 0 }}>
      {bars.map((v, i) => {
        const k = 1 - Math.abs(i - (bars.length - 1) / 2) / (bars.length / 2);
        const bh = 6 + Math.min(1, v * 12) * (h - 44) * (0.4 + 0.6 * k);
        const bx = 44 + (i * (w - 88)) / (bars.length - 1);
        return <rect key={i} x={bx - 4} y={h / 2 - bh / 2} width={8} height={bh} rx={4} fill={tint} opacity={0.3 + 0.7 * k} />;
      })}
    </svg>
  );
}

function Pill({ values, tint, x, y }: { values: number[]; tint: string; x: number; y: number }) {
  const level = Math.min(1, (values.slice(0, HALF).reduce((a, b) => a + b, 0) / HALF) * 8);
  const w = Math.round(560 + level * 80);
  const h = Math.round(150 + level * 14);
  return (
    <div style={{ position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h }}>
      <div style={{ position: 'absolute', inset: -130, borderRadius: 400, background: `radial-gradient(closest-side, ${tint}, transparent)`, opacity: 0.12 + level * 0.6, filter: 'blur(24px)' }} />
      <Bars values={values} w={w} h={h} tint={tint} />
      <LiquidGlass width={w} height={h} radius={h / 2} bevel={30} strength={16} zoom={0.04} dispersion={0.05} style={{ left: 0, top: 0 }} />
    </div>
  );
}

function Speaking({ src, tint, x, y }: { src: string; tint: string; x: number; y: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audio = useAudioData(staticFile(src));
  const values = audio ? visualizeAudio({ fps, frame, audioData: audio, numberOfSamples: 64, smoothing: true }).slice(1) : [];
  return <Pill values={values.length ? values : new Array(HALF).fill(0)} tint={tint} x={x} y={y} />;
}

export function VoicePill({ src, tint, x, y }: { src?: string; tint: string; x: number; y: number }) {
  return src ? <Speaking src={src} tint={tint} x={x} y={y} /> : <Pill values={new Array(HALF).fill(0)} tint={tint} x={x} y={y} />;
}
