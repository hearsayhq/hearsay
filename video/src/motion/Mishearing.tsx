/**
 * Motion study, the opener: a person says "add fifteen dollars of fruit", the words ride the
 * waveform, the glass slides onto "fifteen" and it comes out "fifty". Then what the add-on did
 * with it, and the finding Hearsay raises (a real check id, source and sentence).
 */
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { LiquidGlass } from '../glass/LiquidGlass';
import { Stage } from '../product/Stage';
import { c, mono, sans } from '../theme';

const WORDS = ['add', 'fifteen', 'dollars', 'of', 'fruit'];
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

function Waveform({ f, head }: { f: number; head: number }) {
  const W = 1500;
  const pts: string[] = [];
  for (let x = 0; x <= W; x += 4) {
    const behind = head - x;
    const env = behind < 0 ? 0 : Math.exp(-((behind - 120) ** 2) / (2 * 260 ** 2)) + (behind > 0 ? 0.08 : 0);
    const y = env * (Math.sin(x * 0.045 + f * 0.35) * 36 + Math.sin(x * 0.11 - f * 0.2) * 18 + Math.sin(x * 0.019 + f * 0.05) * 14);
    pts.push(`${x},${y.toFixed(1)}`);
  }
  return (
    <svg width={W} height={200} viewBox={`0 -100 ${W} 200`} style={{ position: 'absolute', left: (1920 - W) / 2, top: 250, overflow: 'visible' }}>
      <defs>
        <linearGradient id="wave" x1="0" x2="1">
          <stop offset="0" stopColor={c.amber} stopOpacity="0" />
          <stop offset="0.25" stopColor={c.amber} stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffd9a0" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <polyline points={pts.join(' ')} fill="none" stroke="url(#wave)" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

export function Mishearing() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = interpolate(f, [10, 150], [0, 1500], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const morph = interpolate(f, [205, 250], [0, 1], { ...clamp, easing: ease });
  const lensX = interpolate(spring({ frame: f - 150, fps, config: { damping: 18, mass: 0.9 } }), [0, 1], [1500, 0]);
  const lensOut = interpolate(f, [300, 340], [0, 1], { ...clamp, easing: ease });
  const rise = interpolate(f, [300, 360], [0, 1], { ...clamp, easing: ease });
  const card = spring({ frame: f - 330, fps, config: { damping: 16 } });
  const tag = spring({ frame: f - 380, fps, config: { damping: 16 } });
  const split = Math.sin(morph * Math.PI) * 6;

  return (
    <Stage>
      <AbsoluteFill style={{ transform: `translateY(${-rise * 170}px) scale(${1 - rise * 0.12})` }}>
        <Waveform f={f} head={head} />
        <div style={{ position: 'absolute', top: 470, width: '100%', display: 'flex', justifyContent: 'center', gap: 34, fontFamily: sans, fontWeight: 600, fontSize: 104, letterSpacing: -2.5, color: c.text }}>
          {WORDS.map((w, i) => {
            const at = 20 + i * 26;
            const o = interpolate(f, [at, at + 18], [0, 1], clamp);
            const y = interpolate(f, [at, at + 24], [26, 0], { ...clamp, easing: ease });
            if (w !== 'fifteen')
              return <span key={w} style={{ opacity: o, transform: `translateY(${y}px)`, display: 'inline-block' }}>{w}</span>;
            const width = interpolate(morph, [0, 1], [372, 214]);
            return (
              <span key={w} style={{ position: 'relative', display: 'inline-block', opacity: o, transform: `translateY(${y}px)`, width }}>
                <span style={{ position: 'absolute', left: 0, right: 0, top: -58, textAlign: 'center', fontSize: 22, fontWeight: 600, letterSpacing: 6 }}>
                  <span style={{ position: 'absolute', left: 0, right: 0, color: c.muted, opacity: 1 - morph }}>SAID</span>
                  <span style={{ position: 'absolute', left: 0, right: 0, color: c.amber, opacity: morph }}>HEARD</span>
                </span>
                <span style={{ position: 'absolute', left: 0, opacity: 1 - morph, filter: `blur(${morph * 8}px)`, transform: `translateY(${-morph * 30}px)`, textShadow: `${split}px 0 rgba(255,60,80,0.8), ${-split}px 0 rgba(60,200,255,0.8)` }}>fifteen</span>
                <span style={{ position: 'absolute', left: 0, opacity: morph, color: c.amber, filter: `blur(${(1 - morph) * 8}px)`, transform: `translateY(${(1 - morph) * 30}px)`, textShadow: `${split}px 0 rgba(255,60,80,0.8), ${-split}px 0 rgba(60,200,255,0.8)` }}>fifty</span>
                <span style={{ visibility: 'hidden' }}>fifteen</span>
                <LiquidGlass width={440} height={170} radius={85} bevel={34} strength={20} zoom={0.08} style={{ left: width / 2 - 220 + lensX + lensOut * 1600, top: -20 }} />
              </span>
            );
          })}
        </div>
      </AbsoluteFill>

      <div style={{ position: 'absolute', left: 560, top: 640, width: 800, opacity: card, transform: `translateY(${(1 - card) * 40}px)`, fontFamily: sans }}>
        <div style={{ background: 'rgba(30,30,28,0.92)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 18, padding: '26px 30px', boxShadow: '0 30px 80px rgba(0,0,0,0.45)' }}>
          <div style={{ fontSize: 20, color: c.muted }}>Grocery add-on, flawed build</div>
          <div style={{ fontSize: 40, fontWeight: 600, color: c.text, marginTop: 6 }}>“Are you sure?” … “Added.”</div>
          <div style={{ fontFamily: mono, fontSize: 20, color: c.muted, marginTop: 10 }}>orders_stage_cart {'{'} sku: "sku-fruit", amountUsd: 50 {'}'}</div>
        </div>
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 14, opacity: tag, transform: `translateX(${(1 - tag) * -40}px)` }}>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: 1, color: '#ff8a80', background: '#3a1f1d', borderRadius: 6, padding: '4px 10px' }}>ERROR</span>
          <span style={{ fontFamily: mono, fontSize: 22, color: c.text }}>consent.misheard_amount</span>
          <span style={{ fontSize: 16, color: c.amber, border: `1px solid ${c.amberSoft}`, background: c.amberSoft, borderRadius: 6, padding: '3px 9px' }}>Amazon requirement</span>
        </div>
        <div style={{ marginTop: 10, fontSize: 22, color: '#C9D1E0', opacity: tag }}>heard “add fifty dollars of fruit”: orders_stage_cart took the misheard amount without the person hearing it</div>
      </div>
    </Stage>
  );
}
