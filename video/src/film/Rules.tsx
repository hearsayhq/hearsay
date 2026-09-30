/** Amazon's published requirements for add-ons, each with its check, its source and a real finding from our runs. */
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { c, mono, sans } from '../theme';
import { linesOf } from './timeline';
import { Chip, Kicker } from './ui';

const L = linesOf('rules');
const RULES = [
  { rule: 'A tool answers within 500 ms', check: 'latency.tool', src: 'MCP Toolkit quickstart', seen: 'set_scene took 1,103 ms' },
  { rule: 'A reply stays under 30 seconds', check: 'speak.length', src: 'Functional requirements', seen: 'spoken reply is 1,369 characters' },
  { rule: 'No JSON read aloud', check: 'speak.no_structured_dump', src: 'Functional requirements', seen: 'spoken reply contains JSON or brackets' },
  { rule: 'At most five options', check: 'speak.lists', src: 'Functional requirements', seen: '' },
  { rule: 'No payment without a question that names what and how much', check: 'consent.states_details', src: 'Functional requirements', seen: 'the question “Are you sure?” does not say what or how much' },
];

export function Rules() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = (at: number) => spring({ frame: f - at, fps, config: { damping: 15 } });
  const parts = L.k2!.parts!;
  const stamp = pop(L.k3!.at);
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: sans, color: c.text }}>
      <Kicker style={{ position: 'absolute', left: 150, top: 80, opacity: pop(L.k1!.at) }}>AMAZON'S PUBLISHED REQUIREMENTS FOR ADD-ONS</Kicker>
      <div style={{ position: 'absolute', left: 150, top: 125, fontSize: 58, fontWeight: 800, letterSpacing: -1.5, opacity: pop(L.k1!.at + 10) }}>Every finding cites the rule it breaks.</div>
      {RULES.map((r, i) => {
        const k = pop(parts[i]!.at);
        return (
          <div key={r.check} style={{ position: 'absolute', left: 150, right: 150, top: 240 + i * 110, display: 'flex', alignItems: 'center', gap: 28, opacity: k, transform: `translateX(${(1 - k) * -40}px)`, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 18 }}>
            <div style={{ width: 760 }}>
              <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.2 }}>{r.rule}</div>
              <div style={{ fontSize: 20, color: c.amber, marginTop: 6 }}>Amazon · {r.src}</div>
            </div>
            <span style={{ fontFamily: mono, fontSize: 22, color: '#c9d1d9', width: 360 }}>{r.check}</span>
            <span style={{ fontSize: 22, color: c.muted, fontStyle: 'italic', flex: 1 }}>{r.seen && `seen: ${r.seen}`}</span>
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: 150, top: 820, display: 'flex', gap: 14, opacity: stamp, transform: `scale(${0.95 + stamp * 0.05})`, transformOrigin: 'left center' }}>
        <Chip tint={c.amber}>Unofficial</Chip><Chip>doesn't certify anything</Chip><Chip>tells you early</Chip><Chip tint={c.muted}>plus the MCP spec</Chip>
      </div>
    </div>
  );
}
