/** Red (the uncut tape), the agent (recorded session and the cheat tape), green (the uncut console session). */
import { interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { c, mono, sans } from '../theme';
import { Card, Sev, Source } from '../film/ui';
import { Speaking } from './Opening';
import { CLIPS, FPS, linesOf } from './plan';
import { Clip, Tag, Window } from './frames';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** Stands in for a recorded GitHub Actions page until it is captured (docs/09 rule 3); never a mock of GitHub. */
function CiPending({ red, run }: { red: boolean; run: string }) {
  return (
    <Card style={{ position: 'absolute', left: 460, top: 330, width: 1000 }}>
      <div style={{ fontSize: 20, color: c.muted }}>GitHub Actions · pull request #27 · recording of the page pending</div>
      <div style={{ fontFamily: mono, fontSize: 34, marginTop: 14 }}>hearsay / voice <span style={{ color: red ? '#ff8a80' : c.green }}>{red ? '✕' : '✓'}</span></div>
      <div style={{ fontSize: 26, marginTop: 10, color: red ? '#ff8a80' : c.green }}>{red ? 'Process completed with exit code 1.' : 'All checks have passed.'}</div>
      <div style={{ fontFamily: mono, fontSize: 18, color: c.muted, marginTop: 14 }}>github.com/hearsayhq/hearsay/actions/runs/{run}</div>
    </Card>
  );
}

const R = linesOf('red');
const RULES = ['500 ms per tool call', 'replies under 30 s', 'no JSON read aloud', 'at most 5 options', 'no payment without a question that names what and how much'];
export function Red() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tapeEnd = Math.round(CLIPS.red * FPS);
  const r1 = R.r1!;
  const k1 = spring({ frame: f - (r1.at + Math.round((r1.to - r1.at) * 0.35)), fps, config: { damping: 16 } });
  const k2 = spring({ frame: f - (r1.at + Math.round((r1.to - r1.at) * 0.72)), fps, config: { damping: 16 } });
  const rules = spring({ frame: f - R.r2!.at, fps, config: { damping: 16 } });
  const exit = spring({ frame: f - R.r3!.at, fps, config: { damping: 14 } });
  if (f >= tapeEnd) return <CiPending red run="36779993236" />;
  const finding = (id: string, text: string, k: number, top: number) => (
    <Card style={{ position: 'absolute', left: 1480, top, width: 410, padding: '18px 20px', opacity: k * (1 - rules), transform: `translateX(${(1 - k) * 50}px)` }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><Sev level="error" /><span style={{ fontFamily: mono, fontSize: 18 }}>{id}</span></div>
      <div style={{ fontSize: 22, marginTop: 10, lineHeight: 1.35 }}>{text}</div>
      <div style={{ marginTop: 12 }}><Source kind="amazon-fr" /></div>
    </Card>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: sans, color: c.text }}>
      <Window title="hearsay — bash" style={{ left: 50, top: 90 }}><Clip src="clips/household-flawed.mp4" width={1400} /></Window>
      <Tag style={{ left: 50, top: 44 }}>real run · uncut · main @ 9b4acdd · 30 Sep 2026</Tag>
      {finding('consent.misheard_amount', 'Heard “fifty”; the add-on took the amount without the person hearing it.', k1, 130)}
      {finding('consent.decline_holds', 'The person said no, and the order changed anyway.', k2, 400)}
      <Card style={{ position: 'absolute', left: 1480, top: 130, width: 410, padding: '20px 22px', opacity: rules * (1 - exit * 0.25) }}>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: 2, color: c.amber }}>AMAZON'S REQUIREMENTS FOR ADD-ONS</div>
        {RULES.map((r, i) => <div key={r} style={{ fontSize: 22, marginTop: 12, opacity: interpolate(f, [R.r2!.at + i * 18, R.r2!.at + i * 18 + 12], [0, 1], clamp) }}>· {r}</div>)}
      </Card>
      <div style={{ position: 'absolute', left: 1480, top: 690, opacity: exit, transform: `scale(${0.9 + exit * 0.1})`, transformOrigin: 'left center' }}>
        <div style={{ fontFamily: mono, fontSize: 54, fontWeight: 700, color: '#ff8a80' }}>exit 1</div>
        <div style={{ fontSize: 26, marginTop: 4 }}>20 errors · 8 of 10 runs failed</div>
      </div>
    </div>
  );
}

export function Agent3() {
  const loopEnd = Math.round(CLIPS.loop * FPS);
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: sans, color: c.text }}>
      <Sequence durationInFrames={loopEnd} layout="none">
        <Window title="claude — Hearsay MCP server + fix-hearsay-findings" style={{ left: 210, top: 100 }}><Clip src="clips/agent-loop.mp4" width={1500} crop={{ x: 263, y: 0, w: 1393, h: 700 }} /></Window>
        <Tag style={{ left: 210, top: 56 }}>recorded Claude Code session · 30 Sep · 4×</Tag>
      </Sequence>
      <Sequence from={loopEnd} layout="none">
        <Window title="hearsay — bash" style={{ left: 210, top: 100 }}><Clip src="clips/agent-cheat.mp4" width={1500} crop={{ x: 20, y: 20, w: 1360, h: 560 }} /></Window>
        <Tag style={{ left: 210, top: 56 }}>real run · uncut · a locked suite, edited</Tag>
      </Sequence>
    </div>
  );
}

const G = linesOf('green');
export function Green() {
  const f = useCurrentFrame();
  const end = Math.round(CLIPS.console * FPS);
  const fruit = G['g-c3']!;
  const heard = interpolate(f, [fruit.at + 20, fruit.at + 34], [0, 1], clamp) * interpolate(f, [G['g-a1']!.to, G['g-a1']!.to + 20], [1, 0], clamp);
  if (f >= end) return <CiPending red={false} run="36780493038" />;
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: sans, color: c.text }}>
      <Window title="localhost:5180 — Hearsay console" bar="#1b1b19" style={{ left: 60, top: 24 }}>
        <Clip src="clips/console-green.mp4" width={880} crop={{ x: 320, y: 0, w: 1000, h: 1080 }} />
      </Window>
      <div style={{ transform: 'scale(0.8)', transformOrigin: '1420px 360px' }}><Speaking lines={G} x={1420} y={360} /></div>
      <Tag style={{ left: 1080, top: 500, opacity: heard, fontSize: 26 }}>said “fifteen” · heard “fifty”</Tag>
      <div style={{ position: 'absolute', left: 1080, top: 180, fontSize: 24, color: c.muted, width: 720 }}>Hearsay console · grocery add-on, fixed build · a real session, uncut</div>
    </div>
  );
}
