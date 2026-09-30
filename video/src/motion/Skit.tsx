/**
 * The mishearing as a skit, on real audio. The customer (Amazon Polly) says fifteen; the speech
 * recognizer (Kokoro, a generic character, never named or voiced as any assistant) talks itself
 * into fifty; the flawed grocery add-on asks "Are you sure?" and adds it; fruit piles up to $50;
 * freeze on the finding Hearsay raised against that build.
 */
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import timeline from '../../public/voice/skit.timeline.json';
import { VoicePill } from '../glass/VoicePill';
import { Stage } from '../product/Stage';
import { c, mono, sans } from '../theme';

const FPS = 60;
const LEAD = 20; // frames of room tone before the first line
const EAR = '#9FA8FF';
const ADDON = '#7FE0C7';
type Who = 'customer' | 'ear' | 'addon';
// Every beat follows the dialogue's own timeline (voice/make-dialogue.mjs): the picture cuts to the audio.
const LINES = timeline.lines.map((l) => ({ ...l, who: l.who as Who, at: LEAD + Math.round(l.start * FPS), frames: Math.round((l.end - l.start) * FPS) + 6, say: l.text }));
const line = (id: string) => LINES.find((l) => l.id === id)!;
export const SKIT_FRAMES = LEAD + Math.round(timeline.lengthSeconds * FPS) + 200;
// No word timings from the voice model: spread the customer's words over the line by length.
const first = line('customer-fifteen');
const WORDS = (() => {
  const words = first.text.replace(/[.,]/g, '').toLowerCase().split(' ');
  const weight = words.map((w) => w.length + 2);
  const total = weight.reduce((a, b) => a + b, 0);
  let acc = 0;
  return words.map((w, i) => {
    const at = first.at + (acc / total) * first.frames * 0.92;
    acc += weight[i]!;
    return { word: w, at };
  });
})();
const TINT: Record<Who, string> = { customer: c.amber, ear: EAR, addon: ADDON };
const NAME: Record<Who, string> = { customer: 'CUSTOMER', ear: 'SPEECH RECOGNITION', addon: 'GROCERY ADD-ON' };
const FRUIT = ['🍎', '🍊', '🍌', '🍇', '🍐', '🍓', '🍍', '🥝', '🍑', '🍋'];
const ADDED = line('addon-added');
const FREEZE = ADDED.at + ADDED.frames + 40;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);

export function Skit() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const now = [...LINES].reverse().find((l) => f >= l.at && f < l.at + l.frames);
  const last = [...LINES].reverse().find((l) => f >= l.at);
  const definitely = line('ear-definitely');
  const landed = definitely.at + Math.round(definitely.frames * 0.45);
  const slot = f < line('ear-fifteen').at ? 'fifteen' : f < line('ear-fifty').at ? 'fifteen?' : f < landed ? 'fifty?' : 'fifty';
  const settled = spring({ frame: f - landed, fps, config: { damping: 9, stiffness: 180 } });
  const jitter = f >= line('ear-whoops').at && f < landed ? Math.sin(f * 1.7) * 3 : 0;
  const frozen = f >= FREEZE;
  const dim = interpolate(f, [FREEZE, FREEZE + 20], [0, 1], clamp);
  const card = spring({ frame: f - (FREEZE + 16), fps, config: { damping: 16 } });
  const cart = interpolate(f, [ADDED.at + 6, ADDED.at + 96], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const trayIn = line('addon-sure').at - 10;
  return (
    <Stage>
      {LINES.map((l) => (
        <Sequence key={l.at} from={l.at} durationInFrames={l.frames}>
          <Audio src={staticFile(l.src)} />
        </Sequence>
      ))}
      <AbsoluteFill style={{ filter: `saturate(${1 - dim * 0.7}) brightness(${1 - dim * 0.45}) blur(${dim * 7}px)` }}>
        {now ? (
          <Sequence from={now.at} durationInFrames={now.frames} layout="none">
            <VoicePill src={now.src} tint={TINT[now.who]} x={960} y={250} />
          </Sequence>
        ) : (
          <VoicePill tint={TINT[last?.who ?? 'customer']} x={960} y={250} />
        )}
        <div style={{ position: 'absolute', top: 350, width: '100%', textAlign: 'center', fontFamily: sans, fontSize: 20, fontWeight: 600, letterSpacing: 5, color: TINT[(now ?? last)?.who ?? 'customer'] }}>
          {NAME[(now ?? last)?.who ?? 'customer']}
        </div>
        {now && now.id !== 'customer-fifteen' && (
          <div style={{ position: 'absolute', top: 392, width: '100%', textAlign: 'center', fontFamily: sans, fontSize: 38, fontStyle: 'italic', color: TINT[now.who] }}>“{now.say}”</div>
        )}
        <div style={{ position: 'absolute', top: 500, width: '100%', display: 'flex', justifyContent: 'center', gap: 28, fontFamily: sans, fontWeight: 600, fontSize: 92, letterSpacing: -2.2, color: c.text }}>
          {WORDS.map(({ word, at: t }) => {
            const o = interpolate(f, [t, t + 10], [0, 1], clamp);
            const y = interpolate(f, [t, t + 18], [22, 0], { ...clamp, easing: ease });
            if (word !== 'fifteen') return <span key={word} style={{ opacity: o, transform: `translateY(${y}px)`, display: 'inline-block' }}>{word}</span>;
            const final = slot === 'fifty';
            return (
              <span key={word} style={{ display: 'inline-block', minWidth: 300, textAlign: 'center', opacity: o, color: final ? c.amber : slot.endsWith('?') ? EAR : c.text, transform: `translate(${jitter}px, ${y}px) scale(${final ? 1 + (1 - settled) * 0.25 : 1})` }}>
                {slot}
              </span>
            );
          })}
        </div>
        <div style={{ position: 'absolute', left: 560, top: 680, width: 800, height: 230, opacity: interpolate(f, [trayIn, trayIn + 30], [0, 1], clamp) }}>
          <div style={{ position: 'absolute', left: 0, bottom: 0, width: 800, height: 120, borderRadius: 24, background: 'rgba(30,30,28,0.9)', border: '1px solid rgba(255,255,255,0.10)' }} />
          {cart > 0 &&
            Array.from({ length: 46 }, (_, i) => {
              const born = ADDED.at + 6 + i * 2;
              const p = spring({ frame: f - born, fps, config: { damping: 12, mass: 0.6 } });
              const x = 30 + ((i * 0.6180339887) % 1) * 720;
              const mound = 70 * Math.exp(-(((x - 390) / 260) ** 2));
              const yEnd = 124 - mound * Math.min(1, (i + 6) / 40) - ((i * 0.7548776662) % 1) * 22;
              return <span key={i} style={{ position: 'absolute', left: x, top: interpolate(p, [0, 1], [-240, yEnd]), fontSize: 44, opacity: interpolate(f, [born, born + 6], [0, 1], clamp), transform: `rotate(${(i * 53) % 70 - 35}deg)`, fontFamily: 'Apple Color Emoji' }}>{FRUIT[i % FRUIT.length]}</span>;
            })}
          <div style={{ position: 'absolute', right: 30, bottom: 30, fontFamily: mono, fontSize: 44, fontWeight: 500, color: c.text, textShadow: '0 4px 20px rgba(0,0,0,0.8)', zIndex: 2 }}>${(50 * cart).toFixed(2)}</div>
          <div style={{ position: 'absolute', left: 0, top: -34, fontFamily: mono, fontSize: 20, color: c.muted }}>orders_stage_cart {'{'} sku: "sku-fruit", amountUsd: 50 {'}'}</div>
        </div>
      </AbsoluteFill>
      {frozen && (
        <div style={{ position: 'absolute', left: 520, top: 380, width: 880, opacity: card, transform: `translateY(${(1 - card) * 50}px) scale(${0.96 + card * 0.04})`, fontFamily: sans }}>
          <div style={{ background: 'rgba(22,24,32,0.96)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 22, padding: '30px 34px', boxShadow: '0 40px 120px rgba(0,0,0,0.6)' }}>
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: 4, color: c.amber }}>HEARSAY</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: 1, color: '#ff8a80', background: '#3a1f1d', borderRadius: 6, padding: '4px 10px' }}>ERROR</span>
              <span style={{ fontFamily: mono, fontSize: 26, color: c.text }}>consent.misheard_amount</span>
              <span style={{ fontSize: 16, color: c.amber, border: `1px solid ${c.amberSoft}`, background: c.amberSoft, borderRadius: 6, padding: '3px 9px' }}>Amazon requirement</span>
            </div>
            <div style={{ marginTop: 14, fontSize: 26, lineHeight: 1.4, color: '#D5DBE8' }}>heard “add fifty dollars of fruit”: orders_stage_cart took the misheard amount without the person hearing it</div>
          </div>
        </div>
      )}
    </Stage>
  );
}
