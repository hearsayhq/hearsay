/** CI and the close: the grocery check failing then passing (real runs), the green Kitchen run, the end card. */
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import kitchen from '../data/kitchen-green.txt';
import { c, mono, sans } from '../theme';
import { linesOf } from './timeline';
import { Card, Chip, Terminal } from './ui';

const L = linesOf('close');
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const green = (kitchen as string).split('\n').filter((l) => /^kitchen ·|runs failed/.test(l));

export function Close() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fixedAt = L.z1!.at + Math.round((L.z1!.to - L.z1!.at) * 0.55);
  const pass = f >= fixedAt;
  const flip = spring({ frame: f - fixedAt, fps, config: { damping: 12 } });
  const term = interpolate(f, [L.z2!.at - 10, L.z2!.at + 15], [0, 1], clamp);
  const endAt = L.z2!.to + 20;
  const end = spring({ frame: f - endAt, fps, config: { damping: 18 } });
  const cmd = '$ npx @hearsayhq/cli run suites/kitchen.yaml';
  const typed = Math.floor(interpolate(f, [L.z2!.at, L.z2!.at + 50], [0, cmd.length], clamp));
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: sans, color: c.text }}>
      <div style={{ opacity: (1 - term) * (1 - end) }}>
        <Card style={{ position: 'absolute', left: 460, top: 300, width: 1000 }}>
          <div style={{ fontSize: 22, color: c.muted }}>Pull request checks</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 20, padding: '18px 22px', borderRadius: 16, background: 'rgba(255,255,255,0.04)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 22, display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 800, color: c.ink, background: pass ? c.green : '#ff8a80', transform: `scale(${pass ? 0.8 + flip * 0.2 : 1})` }}>{pass ? '✓' : '✕'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: mono, fontSize: 28 }}>hearsay / voice</div>
              <div style={{ fontSize: 22, color: pass ? c.green : '#ff8a80', marginTop: 4 }}>{pass ? 'Passing · 0 errors · 0 of 10 runs failed' : 'Failing · 20 errors · 8 of 10 runs failed'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 22 }}><Chip>no API keys</Chip><Chip>scripted, deterministic</Chip><Chip>exit code = verdict</Chip></div>
        </Card>
      </div>
      <div style={{ position: 'absolute', left: 360, top: 330, width: 1200, opacity: term * (1 - end) }}>
        <Terminal title="~/hearsay — zsh">
          <div style={{ minHeight: 200 }}>
            <div>{cmd.slice(0, typed)}</div>
            {typed >= cmd.length && green.map((l) => <div key={l} style={{ color: /0 errors/.test(l) ? c.green : '#c9d1d9', marginTop: 10 }}>{l}</div>)}
          </div>
        </Terminal>
      </div>
      <div style={{ position: 'absolute', inset: 0, opacity: end, display: f >= endAt ? 'block' : 'none' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', fontSize: 150, fontWeight: 800, letterSpacing: 12 }}>HEARSAY</div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 500, textAlign: 'center', fontFamily: mono, fontSize: 38, color: c.amber }}>hearsayhq/hearsay · npx @hearsayhq/cli</div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 600, textAlign: 'center', fontSize: 28, color: c.text }}>Open source · Preflight checks for Alexa+ add-ons</div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 690, textAlign: 'center', fontSize: 24, color: c.muted }}>Unofficial. Not affiliated with or endorsed by Amazon. · Voices are AI-generated.</div>
      </div>
    </div>
  );
}
