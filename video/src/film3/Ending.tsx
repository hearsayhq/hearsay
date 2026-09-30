/** How (the diagram), proof (docs/15), close (the fresh-clone tape) and the end card. */
import { interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { c, mono, sans } from '../theme';
import { Chip } from '../film/ui';
import { CLIPS, FPS, linesOf } from './plan';
import { Clip, Tag, Window } from './frames';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const H = linesOf('how');
export function How3() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const parts = H.h1!.parts!;
  const pop = (at: number) => spring({ frame: f - at, fps, config: { damping: 15 } });
  const swap = interpolate(f, [parts[0]!.at + 90, parts[0]!.at + 120], [0, 1], clamp);
  const box = (label: string, sub: string, x: number, w: number, tint: string, k: number, top = 330) => (
    <div style={{ position: 'absolute', left: x, top, width: w, height: 190, borderRadius: 22, border: `2px solid ${tint}`, background: 'rgba(22,24,32,0.9)', display: 'grid', placeItems: 'center', textAlign: 'center', opacity: k, transform: `translateY(${(1 - k) * 20}px)` }}>
      <div><div style={{ fontSize: 34, fontWeight: 700 }}>{label}</div><div style={{ fontSize: 22, color: tint, marginTop: 8 }}>{sub}</div></div>
    </div>
  );
  const a = pop(parts[0]!.at);
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: sans, color: c.text }}>
      {box('Speech', 'the customer', 150, 300, c.muted, a)}
      <div style={{ position: 'absolute', left: 520, top: 330, width: 820, height: 190 }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - swap }}>{box('Speech recognition + the model', 'Amazon', 0, 820, '#9FA8FF', a, 0)}</div>
        <div style={{ position: 'absolute', inset: 0, opacity: swap }}>{box('Your test cases, clean and misheard', 'Hearsay stands in', 0, 820, c.amber, 1, 0)}</div>
      </div>
      {box('Your tool', 'your code, really running', 1410, 360, '#7FE0C7', a)}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: a }}>
        {[[450, 520], [1340, 1410]].map(([x1, x2]) => <line key={x1} x1={x1! + 10} y1={425} x2={x2! - 10} y2={425} stroke="rgba(255,255,255,0.35)" strokeWidth={4} />)}
      </svg>
      <div style={{ position: 'absolute', left: 150, top: 600, display: 'flex', gap: 14, opacity: pop(parts[1]!.at) }}>
        {['no microphone', 'no API keys', 'the same result every time'].map((x) => <Chip key={x}>{x}</Chip>)}
      </div>
      <div style={{ position: 'absolute', left: 150, top: 690, fontSize: 52, fontWeight: 800, letterSpacing: -1, opacity: pop(parts[2]!.at) }}>So it runs on <span style={{ color: c.amber }}>every pull request.</span></div>
    </div>
  );
}

const P = linesOf('proof');
export function Proof() {
  const f = useCurrentFrame();
  const bar = (label: string, value: number, text: string, tint: string, at: number) => {
    const k = interpolate(f, [at, at + 40], [0, 1], clamp);
    return (
      <div style={{ marginBottom: 26 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, marginBottom: 10 }}><span>{label}</span><span style={{ fontWeight: 700, color: tint === '#5b6b8c' ? c.text : tint }}>{text}</span></div>
        <div style={{ height: 24, borderRadius: 12, background: 'rgba(255,255,255,0.06)' }}><div style={{ width: `${Math.max(value * 100 * k, 1.2)}%`, height: '100%', borderRadius: 12, background: tint }} /></div>
      </div>
    );
  };
  const at = P.p1!.at;
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: sans, color: c.text }}>
      <div style={{ position: 'absolute', left: 160, top: 110, fontSize: 64, fontWeight: 800, letterSpacing: -1.5 }}>We measured it with coding agents.</div>
      <div style={{ position: 'absolute', left: 160, top: 250, width: 760 }}>
        <div style={{ fontSize: 28, color: c.muted, marginBottom: 22 }}>Runs that ended with visible errors</div>
        {bar('With Hearsay', 0, '0 of 36', c.amber, at + 60)}
        {bar('Without Hearsay', 11 / 27, '11 of 27', '#9FA8FF', at + 80)}
      </div>
      <div style={{ position: 'absolute', left: 1000, top: 250, width: 760 }}>
        <div style={{ fontSize: 28, color: c.muted, marginBottom: 22 }}>Unseen cases passed</div>
        {bar('Hearsay now, with coverage', 108 / 129, '83.7 %', c.amber, at + 260)}
        {bar('A precise prompt, no Hearsay', 107 / 129, '82.9 %', '#9FA8FF', at + 280)}
      </div>
      <div style={{ position: 'absolute', left: 160, right: 160, top: 640, fontSize: 21, lineHeight: 1.5, color: c.muted }}>
        3 runs per arm · unseen cases written by the author of the flaws · of the four Hearsay arms counted in the 36, three did worse on unseen cases than the precise prompt; only the current one is level · docs/15
      </div>
    </div>
  );
}

export function Close3() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tapeEnd = Math.round(CLIPS.clone * FPS);
  const end = spring({ frame: f - tapeEnd, fps, config: { damping: 18 } });
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: sans, color: c.text }}>
      <Sequence durationInFrames={tapeEnd} layout="none">
        <Window title="~ — bash" style={{ left: 210, top: 100 }}><Clip src="clips/fresh-clone.mp4" width={1500} crop={{ x: 20, y: 20, w: 1360, h: 600 }} /></Window>
        <Tag style={{ left: 210, top: 56 }}>real run · one take · a fresh clone</Tag>
      </Sequence>
      {f >= tapeEnd && (
        <div style={{ position: 'absolute', inset: 0, opacity: end }}>
          <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
            {[0, 1, 2].map((i) => (
              <path key={i} fill="none" stroke={i === 1 ? c.amber : '#7FE0C7'} strokeOpacity={0.25} strokeWidth={3} d={Array.from({ length: 97 }, (_, k) => `${k === 0 ? 'M' : 'L'} ${k * 20} ${820 + i * 40 + Math.sin(k * 0.18 + f * 0.05 + i) * (30 - i * 6)}`).join(' ')} />
            ))}
          </svg>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 240, textAlign: 'center', fontSize: 150, fontWeight: 800, letterSpacing: 12 }}>HEARSAY</div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 440, textAlign: 'center', fontFamily: mono, fontSize: 36, color: c.amber }}>hearsayhq/hearsay · npx @hearsayhq/cli</div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 530, textAlign: 'center', fontSize: 26 }}>Reproduce this video: README → Demo</div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 610, textAlign: 'center', fontSize: 22, color: c.muted }}>Unofficial. Not affiliated with or endorsed by Amazon. · Voices and B-roll are AI-generated.</div>
        </div>
      )}
    </div>
  );
}
