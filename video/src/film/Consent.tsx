/**
 * Consent on the fixed grocery add-on. Every reply and both host questions are word for word
 * from a run of the fixed build with a $40 permission (src/data/consent-fixed.json).
 */
import { Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { VoicePill } from '../glass/VoicePill';
import { c, mono, sans } from '../theme';
import { linesOf, type Line } from './timeline';
import { Card, Chip } from './ui';

const L = linesOf('consent');
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const MINT = '#7FE0C7';
const GRANT_Q = 'Allow me to reorder milk, eggs, bread, fruit, and oat milk, up to forty dollars in total, for today?';
const BUBBLES: Array<{ id: string; who: 'customer' | 'addon'; heard?: string; code?: string }> = [
  { id: 'c2', who: 'customer' },
  { id: 'c6', who: 'customer', heard: 'heard: add fifty dollars of fruit' },
  { id: 'c7', who: 'addon', code: 'LIMIT_EXCEEDED' },
  { id: 'c9', who: 'customer' },
  { id: 'c10', who: 'addon' },
  { id: 'c11', who: 'customer' },
  { id: 'c13', who: 'customer' },
  { id: 'c14', who: 'addon' },
];

function Dialog({ text, yes, no, at, pick, pickAt }: { text: string; yes: string; no: string; at: number; pick: 'yes' | 'no'; pickAt: number }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = spring({ frame: f - at, fps, config: { damping: 15 } });
  const chosen = f >= pickAt;
  const out = interpolate(f, [pickAt + 30, pickAt + 45], [1, 0], clamp);
  return (
    <div style={{ position: 'absolute', left: 1180, top: 330, width: 620, opacity: k * out, transform: `scale(${0.94 + k * 0.06})` }}>
      <Card style={{ padding: 30 }}>
        <div style={{ fontSize: 18, letterSpacing: 3, color: c.muted, fontWeight: 600 }}>THE ASSISTANT ASKS</div>
        <div style={{ fontSize: 30, lineHeight: 1.4, marginTop: 12 }}>{text}</div>
        <div style={{ display: 'flex', gap: 14, marginTop: 24 }}>
          {[['no', no], ['yes', yes]].map(([k2, label]) => (
            <div key={k2} style={{ flex: 1, textAlign: 'center', padding: '14px 0', borderRadius: 14, fontSize: 24, fontWeight: 600, border: '1px solid rgba(255,255,255,0.16)', background: chosen && pick === k2 ? (k2 === 'yes' ? c.green : '#ff8a80') : 'rgba(255,255,255,0.05)', color: chosen && pick === k2 ? c.ink : c.text }}>{label}</div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function Consent() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const speaking = Object.values(L).find((l) => l.who !== 'narrator' && f >= l.at && f < l.to);
  const visible = BUBBLES.filter((b) => f >= L[b.id]!.at);
  const offset = Math.max(0, visible.length - 5) * 132;
  const shift = interpolate(f, [f - 1, f], [offset, offset]);
  const granted = f >= L.c4!.at;
  const cart = f >= L.c10!.at + 20 ? 7.4 : 0;
  const meter = interpolate(f, [L.c10!.at + 20, L.c10!.at + 50], [0, cart / 40], { ...clamp, easing: Easing.out(Easing.cubic) });
  const nothing = spring({ frame: f - (L.c15!.at + 200), fps, config: { damping: 14 } });
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: sans, color: c.text }}>
      {speaking ? (
        <Sequence from={speaking.at} durationInFrames={speaking.to - speaking.at} layout="none">
          <VoicePill src={speaking.src} tint={speaking.who === 'customer' ? c.amber : MINT} x={960} y={150} />
        </Sequence>
      ) : (
        <VoicePill tint="#5b6b8c" x={960} y={150} />
      )}
      <div style={{ position: 'absolute', left: 160, top: 270, width: 900, height: 700, overflow: 'hidden' }}>
        <div style={{ transform: `translateY(${-shift}px)`, transition: 'none' }}>
          {visible.map((b) => {
            const line = L[b.id] as Line;
            const k = spring({ frame: f - line.at, fps, config: { damping: 16 } });
            const mine = b.who === 'customer';
            return (
              <div key={b.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 22, opacity: k, transform: `translateY(${(1 - k) * 20}px)` }}>
                <div style={{ maxWidth: 700 }}>
                  <div style={{ fontSize: 28, lineHeight: 1.35, padding: '16px 22px', borderRadius: 22, background: mine ? 'rgba(255,170,43,0.14)' : 'rgba(127,224,199,0.12)', border: `1px solid ${mine ? 'rgba(255,170,43,0.35)' : 'rgba(127,224,199,0.3)'}` }}>{line.text}</div>
                  {b.heard && <div style={{ fontFamily: mono, fontSize: 20, color: c.amber, marginTop: 8, textAlign: 'right' }}>{b.heard}</div>}
                  {b.code && <div style={{ fontFamily: mono, fontSize: 18, color: c.muted, marginTop: 8 }}>refused · {b.code}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Card style={{ position: 'absolute', left: 1180, top: 760, width: 620, padding: 24, opacity: granted ? 1 : 0.35 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22 }}>
          <span style={{ color: c.muted }}>{granted ? 'Permission: groceries, today' : 'No permission yet'}</span>
          <span style={{ fontFamily: mono }}>${cart.toFixed(2)} / $40.00</span>
        </div>
        <div style={{ height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.08)', marginTop: 14 }}>
          <div style={{ width: `${meter * 100}%`, height: '100%', borderRadius: 7, background: MINT }} />
        </div>
        <div style={{ marginTop: 16, opacity: nothing }}><Chip tint="#ff8a80">order not placed · cart unchanged</Chip></div>
      </Card>
      {f >= L.c2!.to - 10 && f < L.c4!.to + 60 && <Dialog text={GRANT_Q} no="Not now" yes="Allow" at={L.c2!.to - 10} pick="yes" pickAt={L.c4!.at} />}
      {f >= L.c12!.at && f < L.c13!.to + 60 && <Dialog text={L.c12!.text} no="Not now" yes="Place order" at={L.c12!.at} pick="no" pickAt={L.c13!.at} />}
    </div>
  );
}
