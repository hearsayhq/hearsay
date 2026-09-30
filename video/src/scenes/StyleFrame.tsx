import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { LiquidGlass } from '../glass/LiquidGlass';
import { c, sans } from '../theme';
import { FindingsPanel } from './Findings';

/** Style frame: a real Smart Home report, the glass sliding over it as a lens. */
export function StyleFrame({ pill = false }: { pill?: boolean }) {
  const f = useCurrentFrame();
  const x = interpolate(f, [0, 150], [980, 1210], { easing: Easing.inOut(Easing.cubic), extrapolateRight: 'clamp' });
  const y = interpolate(f, [0, 150], [470, 560], { easing: Easing.inOut(Easing.cubic), extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1200px 800px at 75% 20%, ${c.ink3}, ${c.ink} 60%)`, fontFamily: sans }}>
      <div style={{ position: 'absolute', left: 120, top: 120, width: 560 }}>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: 3, color: c.amber }}>SMART HOME ADD-ON · FLAWED BUILD</div>
        <div style={{ fontSize: 104, fontWeight: 800, lineHeight: 0.95, letterSpacing: -3, color: c.text, marginTop: 28 }}>
          Spoken,
          <br />
          it's broken.
        </div>
        <div style={{ fontSize: 28, lineHeight: 1.45, color: c.muted, marginTop: 36 }}>Every finding names the rule it breaks, where the rule comes from, and the fix.</div>
        <div style={{ display: 'flex', gap: 14, marginTop: 44, fontSize: 22, fontWeight: 600 }}>
          <span style={{ color: c.red }}>17 errors</span>
          <span style={{ color: c.muted }}>·</span>
          <span style={{ color: c.amber }}>9 warnings</span>
          <span style={{ color: c.muted }}>·</span>
          <span style={{ color: c.text }}>5 of 5 runs failed</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 800, top: 130, width: 1000 }}>
        <FindingsPanel reveal={Math.min(f / 40, 1)} />
      </div>
      {pill ? (
        <LiquidGlass width={1060} height={92} radius={46} bevel={30} strength={14} zoom={0.07} style={{ left: interpolate(f, [0, 150], [700, 770], { extrapolateRight: 'clamp' }), top: 528 }} />
      ) : (
        <LiquidGlass width={560} height={300} style={{ left: x, top: y }} />
      )}
    </AbsoluteFill>
  );
}
