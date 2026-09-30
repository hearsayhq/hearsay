/**
 * The opener's mishearing, driven by real audio: the customer's line (Amazon Polly, with word
 * timings) wakes the glass voice pill; the words appear as they are spoken; then what the
 * assistant heard, the flawed grocery add-on's real reply, and the real finding.
 */
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import marks from '../../public/voice/customer-fifteen.words.json';
import { VoicePill } from '../glass/VoicePill';
import { Stage } from '../product/Stage';
import { c, mono, sans } from '../theme';

const START = 30; // frame the customer starts speaking
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export function Mishearing() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = (ms: number) => START + (ms / 1000) * fps;
  const heard = interpolate(f, [190, 230], [0, 1], { ...clamp, easing: ease });
  const card = spring({ frame: f - 250, fps, config: { damping: 16 } });
  const tag = spring({ frame: f - 300, fps, config: { damping: 16 } });
  const lift = interpolate(f, [240, 300], [0, 1], { ...clamp, easing: ease });

  return (
    <Stage>
      <Sequence from={START}>
        <Audio src={staticFile('voice/customer-fifteen.mp3')} />
      </Sequence>
      <AbsoluteFill style={{ transform: `translateY(${-lift * 150}px)` }}>
        <Sequence from={START} layout="none">
          <VoicePill src="voice/customer-fifteen.mp3" tint={c.amber} x={960} y={360} />
        </Sequence>
        <div style={{ position: 'absolute', top: 500, width: '100%', display: 'flex', justifyContent: 'center', gap: 30, fontFamily: sans, fontWeight: 600, fontSize: 96, letterSpacing: -2.4, color: c.text }}>
          {marks.words.map((w) => {
            const word = w.value.replace(/[.,]/g, '').toLowerCase();
            const o = interpolate(f, [at(w.time), at(w.time) + 10], [0, 1], clamp);
            const y = interpolate(f, [at(w.time), at(w.time) + 18], [22, 0], { ...clamp, easing: ease });
            if (word !== 'fifteen') return <span key={w.time} style={{ opacity: o, transform: `translateY(${y}px)`, display: 'inline-block' }}>{word}</span>;
            return (
              <span key={w.time} style={{ position: 'relative', display: 'inline-block', opacity: o, transform: `translateY(${y}px)` }}>
                <span style={{ position: 'absolute', left: 0, right: 0, top: -48, textAlign: 'center', fontSize: 20, letterSpacing: 5 }}>
                  <span style={{ position: 'absolute', left: 0, right: 0, color: c.muted, opacity: 1 - heard }}>SAID</span>
                  <span style={{ position: 'absolute', left: 0, right: 0, color: c.amber, opacity: heard }}>HEARD</span>
                </span>
                <span style={{ display: 'inline-block', color: c.muted, textDecoration: heard > 0.5 ? 'line-through' : 'none', textDecorationThickness: 5, opacity: 1 - heard * 0.65, transform: `translateY(${-heard * 64}px) scale(${1 - heard * 0.45})`, transformOrigin: '50% 100%' }}>fifteen</span>
                <span style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', color: c.amber, opacity: heard, transform: `translateY(${(1 - heard) * 24}px)` }}>fifty</span>
              </span>
            );
          })}
        </div>
      </AbsoluteFill>

      <div style={{ position: 'absolute', left: 560, top: 620, width: 800, opacity: card, transform: `translateY(${(1 - card) * 40}px)`, fontFamily: sans }}>
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
