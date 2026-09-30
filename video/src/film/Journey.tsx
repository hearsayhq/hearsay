/**
 * Explainer, part 1: a request's journey. Person → speech recognition → the assistant's model →
 * your add-on → the spoken reply. A packet carries the request along the path ("fifteen" turns
 * into "fifty" at speech recognition, a tool call at the model, a reply at the add-on); then the
 * camera pulls back and Hearsay drops the four questions onto the hops. Cut to the narration.
 */
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { linesOf } from '../film/timeline';
import { LiquidGlass } from '../glass/LiquidGlass';
import { c, mono, sans } from '../theme';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.45, 0, 0.2, 1);
const L = linesOf('journey');

const Y = 520;
const NODES = [
  { id: 'person', x: 380, label: 'PERSON', tint: c.amber },
  { id: 'asr', x: 1120, label: 'SPEECH RECOGNITION', tint: '#9FA8FF' },
  { id: 'model', x: 1860, label: "ASSISTANT'S MODEL", tint: '#7C9BFF' },
  { id: 'addon', x: 2600, label: 'YOUR ADD-ON', tint: '#7FE0C7' },
  { id: 'reply', x: 3340, label: 'SPOKEN REPLY', tint: '#F4F6FA' },
] as const;
const CANVAS = 3720;

function Icon({ id, tint, t }: { id: string; tint: string; t: number }) {
  const s = { stroke: tint, strokeWidth: 6, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (id === 'person' || id === 'reply')
    return <g>{[0, 1, 2, 3, 4, 5, 6].map((i) => { const h = 18 + Math.abs(Math.sin(t * 0.12 + i * 0.9)) * 46 * (1 - Math.abs(i - 3) / 4); return <rect key={i} x={-63 + i * 18} y={-h / 2} width={9} height={h} rx={4.5} fill={tint} />; })}</g>;
  if (id === 'asr') return <g {...s}><path d="M-60 0 q10 -30 20 0 t20 0 t20 0" /><path d="M10 -18 h50 M10 0 h38 M10 18 h46" /></g>;
  if (id === 'model') return <g {...s}>{[[-40, -25], [40, -25], [0, 30], [-45, 30], [45, 30]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={9} fill={tint} />)}<path d="M-40 -25 L0 30 L40 -25 M-45 30 L0 30 L45 30" /></g>;
  return <g {...s}><rect x={-44} y={-34} width={88} height={68} rx={14} /><path d="M-18 -34 v-16 M18 -34 v-16 M-44 0 h-16 M44 0 h16" /></g>;
}

function Node({ n, lit, f }: { n: (typeof NODES)[number]; lit: number; f: number }) {
  const size = 230;
  return (
    <div style={{ position: 'absolute', left: n.x - size / 2, top: Y - size / 2, width: size, height: size }}>
      <div style={{ position: 'absolute', inset: -90, borderRadius: 999, background: `radial-gradient(closest-side, ${n.tint}, transparent)`, opacity: 0.08 + lit * 0.4, filter: 'blur(18px)' }} />
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0, opacity: 0.55 + lit * 0.45 }}>
        <g transform={`translate(${size / 2} ${size / 2})`}><Icon id={n.id} tint={n.tint} t={f} /></g>
      </svg>
      <LiquidGlass width={size} height={size} radius={size / 2} bevel={34} strength={14} zoom={0.04} dispersion={0.04} style={{ left: 0, top: 0 }} />
      <div style={{ position: 'absolute', top: size + 26, left: -100, right: -100, textAlign: 'center', fontFamily: sans, fontSize: 22, fontWeight: 600, letterSpacing: 4, color: n.tint, opacity: 0.6 + lit * 0.4 }}>{n.label}</div>
    </div>
  );
}

export function Journey() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Where the packet is: at the person, then along each hop as the narration names it.
  const hops = [
    [L['n-trip']!.at + 60, L['n-asr']!.at + 40, 0, 1],
    [L['n-model']!.at - 10, L['n-model']!.at + 70, 1, 2],
    [L['n-reply']!.at - 10, L['n-reply']!.at + 40, 2, 3],
    [L['n-reply']!.at + 60, L['n-reply']!.at + 110, 3, 4],
  ] as const;
  let pos = 0;
  for (const [a, b, from, to] of hops) if (f >= a) pos = from + interpolate(f, [a, b], [0, 1], { ...clamp, easing: ease }) * (to - from);
  const px = interpolate(pos, [0, 1, 2, 3, 4], NODES.map((n) => n.x));
  const flip = L['n-asr']!.at + Math.round((L['n-asr']!.to - L['n-asr']!.at) * 0.62);
  const heard = interpolate(f, [flip, flip + 16], [0, 1], clamp);
  const asCall = interpolate(f, [L['n-model']!.at + 40, L['n-model']!.at + 70], [0, 1], clamp);
  const asReply = interpolate(f, [L['n-reply']!.at + 20, L['n-reply']!.at + 40], [0, 1], clamp);
  const reveal = interpolate(f, [L['n-hearsay']!.at - 20, L['n-hearsay']!.at + 50], [0, 1], { ...clamp, easing: ease });
  const camX = interpolate(reveal, [0, 1], [Math.min(Math.max(px - 960, 0), CANVAS - 1920), (CANVAS * 0.5 - 1920) / 2 / 0.5 + 0]);
  const scale = interpolate(reveal, [0, 1], [1, 0.5]);
  const sweep = interpolate(f, [L['n-hearsay']!.at + 30, L['n-hearsay']!.at + 150], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const q = L['n-q']!.parts!;
  const tags = [
    { q: 'Did it hear me right?', x: (NODES[0].x + NODES[1].x) / 2, y: Y - 250, at: q[0]!.at },
    { q: 'Do I have to wait?', x: (NODES[2].x + NODES[3].x) / 2, y: Y - 250, at: q[1]!.at },
    { q: 'Can I listen to this?', x: NODES[4].x, y: Y - 250, at: q[2]!.at },
    { q: 'Did I agree?', x: NODES[3].x, y: Y + 330, at: q[3]!.at },
  ];

  return (
    <>
      <AbsoluteFill style={{ transformOrigin: '0 0', transform: `scale(${scale}) translateX(${-camX}px) translateY(${reveal * 560}px)` }}>
        <svg width={CANVAS} height={1080} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
          <defs>
            <linearGradient id="path" gradientUnits="userSpaceOnUse" x1={NODES[0].x} y1={Y} x2={NODES[4].x} y2={Y}>
              {NODES.map((n, i) => <stop key={n.id} offset={i / (NODES.length - 1)} stopColor={n.tint} />)}
            </linearGradient>
          </defs>
          <line x1={NODES[0].x} y1={Y} x2={NODES[4].x} y2={Y} stroke="url(#path)" strokeOpacity={0.35} strokeWidth={4} />
          <line x1={NODES[0].x} y1={Y} x2={px} y2={Y} stroke="url(#path)" strokeWidth={6} />
          <path d={`M ${NODES[4].x} ${Y + 150} C ${NODES[4].x} ${Y + 470}, ${NODES[0].x} ${Y + 470}, ${NODES[0].x} ${Y + 150}`} fill="none" stroke={c.muted} strokeOpacity={0.25} strokeWidth={3} strokeDasharray="10 14" strokeDashoffset={-f * 2} />
          {reveal > 0 && <line x1={NODES[0].x - 200} y1={Y} x2={NODES[0].x - 200 + sweep * (NODES[4].x - NODES[0].x + 400)} y2={Y} stroke={c.amber} strokeWidth={10} strokeLinecap="round" opacity={0.9} />}
        </svg>
        {NODES.map((n, i) => <Node key={n.id} n={n} f={f} lit={Math.max(0, 1 - Math.abs(pos - i) * 1.6)} />)}
        <div style={{ position: 'absolute', left: px, top: Y - 210, transform: 'translateX(-50%)', opacity: 1 - reveal, fontFamily: sans, whiteSpace: 'nowrap' }}>
          {asReply > 0 ? (
            <div style={{ fontSize: 44, fontWeight: 600, color: c.text, background: 'rgba(30,30,28,0.92)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '14px 30px', opacity: asReply }}>“Added.”</div>
          ) : asCall > 0 ? (
            <div style={{ fontFamily: mono, fontSize: 32, color: '#7FE0C7', background: 'rgba(20,34,32,0.92)', border: '1px solid rgba(127,224,199,0.35)', borderRadius: 16, padding: '14px 26px', opacity: asCall }}>orders_stage_cart {'{'} amountUsd: <span style={{ color: c.amber }}>50</span> {'}'}</div>
          ) : (
            <div style={{ fontSize: 44, fontWeight: 600, color: c.text, background: 'rgba(30,30,28,0.92)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '14px 30px', opacity: interpolate(f, [L['n-trip']!.at + 40, L['n-trip']!.at + 60], [0, 1], clamp) }}>
              add{' '}
              <span style={{ position: 'relative', display: 'inline-block', minWidth: 150, textAlign: 'center' }}>
                <span style={{ opacity: 1 - heard }}>fifteen</span>
                <span style={{ position: 'absolute', left: 0, right: 0, color: c.amber, opacity: heard, transform: `scale(${1 + (1 - spring({ frame: f - flip, fps, config: { damping: 9 } })) * 0.4})` }}>fifty</span>
              </span>{' '}
              dollars of fruit
            </div>
          )}
        </div>
        {tags.map((t) => {
          const k = spring({ frame: f - t.at, fps, config: { damping: 14 } });
          return (
            <div key={t.q} style={{ position: 'absolute', left: t.x, top: t.y, transform: `translate(-50%, ${(1 - k) * 40}px) scale(${1 / Math.max(scale, 0.5)})`, opacity: k * reveal, fontFamily: sans, fontSize: 30, fontWeight: 600, color: c.ink, background: c.amber, borderRadius: 999, padding: '12px 26px', whiteSpace: 'nowrap', boxShadow: '0 12px 40px rgba(255,170,43,0.35)' }}>
              {t.q}
            </div>
          );
        })}
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 90, textAlign: 'center', fontFamily: sans, fontSize: 64, fontWeight: 800, letterSpacing: -1.5, color: c.text, opacity: interpolate(f, [L['n-hearsay']!.at + 10, L['n-hearsay']!.at + 40], [0, 1], clamp) }}>
        Hearsay rides along the whole trip.
      </div>
    </>
  );
}
