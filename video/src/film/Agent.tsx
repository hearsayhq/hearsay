/**
 * The agent loop (numbers from the recorded M2b run, clips/INDEX.md: 11 errors → green in 21
 * turns and 56 s, only src/server.ts changed, suites untouched), then the lock and the holdouts
 * (the real suite.integrity message).
 */
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { LiquidGlass } from '../glass/LiquidGlass';
import { c, mono, sans } from '../theme';
import { linesOf } from './timeline';
import { Card, Chip, Sev } from './ui';

const L = linesOf('agent');
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const NODES = [
  { label: 'Your coding agent', x: 560, y: 400, tint: '#9FA8FF', glyph: '>_' },
  { label: 'Hearsay MCP server', x: 1360, y: 400, tint: c.amber, glyph: 'H' },
  { label: 'src/server.ts', x: 960, y: 690, tint: '#7FE0C7', glyph: '{ }' },
];

function GlassNode({ n, lit }: { n: (typeof NODES)[number]; lit: number }) {
  const s = 190;
  return (
    <div style={{ position: 'absolute', left: n.x - s / 2, top: n.y - s / 2, width: s, height: s }}>
      <div style={{ position: 'absolute', inset: -70, borderRadius: 999, background: `radial-gradient(closest-side, ${n.tint}, transparent)`, opacity: 0.1 + lit * 0.4, filter: 'blur(16px)' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: mono, fontSize: 56, fontWeight: 600, color: n.tint }}>{n.glyph}</div>
      <LiquidGlass width={s} height={s} radius={s / 2} bevel={28} strength={12} zoom={0.03} dispersion={0.04} style={{ left: 0, top: 0 }} />
      <div style={{ position: 'absolute', top: s + 18, left: -120, right: -120, textAlign: 'center', fontFamily: sans, fontSize: 24, fontWeight: 600, color: n.tint }}>{n.label}</div>
    </div>
  );
}

export function Agent() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const loopStart = L.a2!.at + 20;
  const loopEnd = L.a2!.to - 30;
  const turns = interpolate(f, [loopStart, loopEnd], [0, 3], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const seg = turns % 1;
  const leg = Math.floor(turns) % 3;
  const [a, b] = [[0, 1], [1, 2], [2, 0]][leg]! as [number, number];
  const dot = { x: NODES[a]!.x + (NODES[b]!.x - NODES[a]!.x) * seg, y: NODES[a]!.y + (NODES[b]!.y - NODES[a]!.y) * seg };
  const green = f >= loopEnd;
  const done = spring({ frame: f - loopEnd, fps, config: { damping: 12 } });
  const lock = interpolate(f, [L.a3!.at - 10, L.a3!.at + 20], [0, 1], clamp);
  const breach = spring({ frame: f - (L.a3!.at + 70), fps, config: { damping: 14 } });
  const loopOut = 1 - lock;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ opacity: loopOut, position: 'absolute', inset: 0 }}>
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          <polygon points={NODES.map((n) => `${n.x},${n.y}`).join(' ')} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={3} strokeDasharray="10 12" strokeDashoffset={-f * 2} />
          {f >= loopStart && !green && <circle cx={dot.x} cy={dot.y} r={12} fill={c.amber} />}
        </svg>
        {NODES.map((n, i) => <GlassNode key={n.label} n={n} lit={f >= loopStart && !green ? (i === a ? 1 - seg : i === b ? seg : 0) : green ? 0.6 : 0.2} />)}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 470, textAlign: 'center', fontFamily: sans }}>
          <div style={{ fontSize: 76, fontWeight: 800, color: green ? c.green : '#ff8a80', transform: `scale(${green ? 1 + (1 - done) * 0.3 : 1})`, opacity: f >= L.a2!.at ? 1 : 0 }}>{green ? 'green' : '11 errors'}</div>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 120, display: 'flex', justifyContent: 'center', gap: 16, opacity: interpolate(f, [L.a2!.at + 40, L.a2!.at + 70], [0, 1], clamp) }}>
          <Chip>hearsay_run</Chip><Chip>fix</Chip><Chip>hearsay_run only: "failed"</Chip>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 880, display: 'flex', justifyContent: 'center', gap: 16, opacity: done }}>
          <Chip tint={c.green}>21 turns · 56 s</Chip><Chip>only src/server.ts changed</Chip><Chip>suites untouched</Chip>
        </div>
      </div>
      <div style={{ opacity: lock, position: 'absolute', inset: 0 }}>
        <Card style={{ position: 'absolute', left: 260, top: 250, width: 720 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: mono, fontSize: 24 }}>suites/kitchen.yaml</span>
            <span style={{ fontFamily: sans, fontSize: 20, color: c.amber }}>🔒 locked</span>
          </div>
          <div style={{ fontFamily: mono, fontSize: 22, lineHeight: 1.6, marginTop: 18, color: '#c9d1d9' }}>
            <div>- id: start-pasta-timer</div>
            <div>{'  '}say: set a pasta timer for fifteen minutes</div>
            <div style={{ color: breach > 0.1 ? '#ff8a80' : '#c9d1d9', textDecoration: breach > 0.1 ? 'line-through' : 'none' }}>{'  '}args: {'{'} minutes: 15, label: pasta {'}'}</div>
            {breach > 0.1 && <div style={{ color: c.green, opacity: breach }}>{'  '}args: {'{'} minutes: 50, label: pasta {'}'}</div>}
          </div>
        </Card>
        <Card style={{ position: 'absolute', left: 260, top: 640, width: 1100, opacity: breach, transform: `translateY(${(1 - breach) * 30}px)` }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><Sev level="error" /><span style={{ fontFamily: mono, fontSize: 24 }}>suite.integrity</span></div>
          <div style={{ fontSize: 26, marginTop: 12 }}>suites/kitchen.yaml changed since it was locked; this run cannot count as green</div>
        </Card>
        <div style={{ position: 'absolute', left: 1100, top: 260, width: 560 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ position: 'absolute', left: i * 18, top: i * 18, width: 480, height: 280, borderRadius: 22, background: 'linear-gradient(135deg, #1b2440, #121a30)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 20px 60px rgba(0,0,0,0.45)', display: 'grid', placeItems: 'center', fontFamily: sans, fontSize: 30, fontWeight: 600, color: c.muted }}>
              {i === 2 ? 'holdout cases · hidden' : ''}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
