/** The experiment (docs/15): unseen cases passed and runs that ended with visible defects. */
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { c, sans } from '../theme';
import { linesOf } from './timeline';
import { Chip } from './ui';

const L = linesOf('experiment');
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ARMS = [
  { label: 'Hearsay, suite only', pass: 88, defects: 0, tint: '#5b6b8c' },
  { label: 'Precise prompt, no Hearsay', pass: 107, defects: 4, tint: '#9FA8FF' },
  { label: 'Hearsay with coverage', pass: 108, defects: 0, tint: c.amber },
];

export function Experiment() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const title = spring({ frame: f - L.e1!.at, fps, config: { damping: 16 } });
  const show = (i: number) => (i === 0 ? L.e2!.at : i === 1 ? L.e3!.at : L.e3!.at + 30);
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: sans, color: c.text }}>
      <div style={{ position: 'absolute', left: 160, top: 110, fontSize: 72, fontWeight: 800, letterSpacing: -2, opacity: title }}>We measured it.</div>
      <div style={{ position: 'absolute', left: 160, top: 230, display: 'flex', gap: 12, opacity: interpolate(f, [L.e2!.at + 150, L.e2!.at + 180], [0, 1], clamp) }}>
        {['coverage.tools', 'coverage.values', 'coverage.decline', 'coverage.limits'].map((x) => <Chip key={x} tint={c.amber}>{x}</Chip>)}
      </div>
      {[
        { title: 'Unseen cases passed', x: 160, value: (a: (typeof ARMS)[number]) => a.pass / 129, text: (a: (typeof ARMS)[number]) => `${((a.pass / 129) * 100).toFixed(1)} %` },
        { title: 'Runs that left defects behind', x: 1000, value: (a: (typeof ARMS)[number]) => a.defects / 9, text: (a: (typeof ARMS)[number]) => `${a.defects} of 9` },
      ].map((chart, ci) => (
        <div key={chart.title} style={{ position: 'absolute', left: chart.x, top: 330, width: 760, opacity: ci === 1 ? interpolate(f, [L.e3!.at + 140, L.e3!.at + 170], [0, 1], clamp) : 1 }}>
          <div style={{ fontSize: 30, fontWeight: 600, color: c.muted, marginBottom: 26 }}>{chart.title}</div>
          {ARMS.map((a, i) => {
            const k = interpolate(f, [show(i) + (ci === 1 ? 150 : 0), show(i) + (ci === 1 ? 190 : 40)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
            return (
              <div key={a.label} style={{ marginBottom: 30, opacity: k > 0 ? 1 : 0.15 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, marginBottom: 10 }}>
                  <span>{a.label}</span>
                  <span style={{ fontWeight: 700, color: a.tint === '#5b6b8c' ? c.text : a.tint }}>{chart.text(a)}</span>
                </div>
                <div style={{ height: 26, borderRadius: 13, background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ height: '100%', width: `${Math.max(chart.value(a) * 100 * k, ci === 1 && a.defects === 0 ? 1.5 : 0)}%`, borderRadius: 13, background: a.tint, boxShadow: a.tint === c.amber ? '0 0 30px rgba(255,170,43,0.5)' : 'none' }} />
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ position: 'absolute', left: 160, top: 820, fontSize: 24, color: c.muted, opacity: interpolate(f, [L.e3!.at, L.e3!.at + 30], [0, 1], clamp) }}>
        3 runs per arm · 3 flawed add-ons · unseen cases written by the author of the flaws (docs/15)
      </div>
    </div>
  );
}
