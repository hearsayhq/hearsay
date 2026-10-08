/**
 * 08 · For coding agents. Hearsay is an MCP server itself, with Agent Skills; a fresh Claude Code
 * session, in Claude Code's own interface, uses it to turn a flawed add-on green without touching
 * the tests (scripts/agent-loop.sh --ui, screen-recorded by the owner, sped up and labelled). Then
 * the locked tests: change one, and the run fails (real run).
 */
import type { ReactNode } from 'react';
import { CLIPS, CLIP_AT } from '../film5/plan';
import { Rec, track } from '../film4/kit';
import { display, mono, P, QIO, serif } from './design';
import { cueOf, Draw, Hi, Label, Morph, Odometer, Place, ramp, sec, Stamp, Svg, Target, useF, useInk, Window, Words } from './kit';
import { CI_WIN } from './Demo';

const WIN = { x: 96, y: 290, w: 1180, h: 600 };

/**
 * The session (public/clips/v6/agent-ui.mp4): the owner's screen recording of
 * `scripts/agent-loop.sh --ui`, 8 Oct 2026, Opus 5.5, cropped to the terminal and trimmed to start
 * at the "before" run. Seconds into the clip: the before run's 17 errors, Claude Code starting,
 * its own Hearsay run going green, and the script's after run with git diff.
 */
export const AGENT_UI = { src: 'clips/v6/agent-ui.mp4', w: 1752, h: 1148, seconds: 175, before: 1, claude: 8, green: 131, after: 171 } as const;
export const AGENT_UI_SPEED = 19;
export const agentFinePrint6 = `Real Claude Code session (Opus 5.5) in its own interface: scripts/agent-loop.sh --ui at main 5236ff1, 8 Oct 2026, screen-recorded, shown at ${AGENT_UI_SPEED}× speed; 2 min 29 s of work. Only src/ changed; suites/ and the lock untouched.`;

function Tile({ x, at, title, sub, children }: { x: number; at: number; title: string; sub: string; children?: ReactNode }) {
  const fr = useF();
  const ink = useInk();
  const k = ramp(fr, at - 6, at + 22, 0, 1, QIO);
  return (
    <div style={{ position: 'absolute', left: x, top: 120, width: 600, height: 130, border: `2px solid ${ink.fg}`, display: 'flex', alignItems: 'center', gap: 24, padding: '0 28px', clipPath: `inset(0 ${(1 - k) * 100}% 0 0)`, background: ink.raise }}>
      {children}
      <div>
        <div style={{ fontFamily: display, fontSize: 40, fontWeight: 750, letterSpacing: '-0.03em', color: ink.fg }}>{title}</div>
        <div style={{ fontFamily: mono, fontSize: 17, color: ink.muted, marginTop: 6 }}>{sub}</div>
      </div>
    </div>
  );
}

export function Agent() {
  const fr = useF();
  const ink = useInk();
  const w = cueOf('agent');
  const start = sec(0.4);
  const t = Math.max(0, (fr - start) / 60) * AGENT_UI_SPEED;
  const at = (clipSec: number) => start + Math.round((clipSec / AGENT_UI_SPEED) * 60);
  const vh = (WIN.h * AGENT_UI.w) / WIN.w;
  // The top of the session while it fills the screen, then its newest lines, then the after run.
  const view = track(fr, [
    [at(70), { x: 0, y: 0, w: AGENT_UI.w }],
    [at(88), { x: 0, y: AGENT_UI.h - vh, w: AGENT_UI.w }],
    [at(AGENT_UI.after) - 4, { x: 0, y: AGENT_UI.h - vh, w: AGENT_UI.w }],
    [at(AGENT_UI.after) + 14, { x: 0, y: AGENT_UI.h - 980 * (WIN.h / WIN.w), w: 980 }],
  ]);
  const link = ramp(fr, w('agent', 7) - 4, w('agent', 11) + 10, 0, 1, QIO);
  const green = at(AGENT_UI.green);
  return (
    <>
      <Tile x={96} at={w('agent', 0)} title="Hearsay · MCP server" sub="+ Agent Skills · a developer tool"><Target size={74} k={ramp(fr, w('agent', 0), w('agent', 0) + 30)} a={ink.fg} /></Tile>
      <Svg><Draw d="M 700 185 L 1220 185" at={w('agent', 7) - 4} dur={30} width={3} stroke={P.orange} /></Svg>
      <div style={{ position: 'absolute', left: 700 + 520 * link - 10, top: 175, width: 20, height: 20, borderRadius: 10, background: P.orange, opacity: link > 0 && link < 1 ? 1 : 0 }} />
      <Tile x={1224} at={w('agent', 9)} title="your coding agent" sub="here: Claude Code, a fresh session">
        <div style={{ width: 74, height: 74, border: `2px solid ${ink.fg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono, fontSize: 28, color: P.orange }}>&gt;_</div>
      </Tile>
      {/* In: the pull request's window becomes the agent's session. */}
      <Morph from={CI_WIN} to={{ x: WIN.x, y: WIN.y, w: WIN.w, h: WIN.h + 38 }} a={0} b={26} fill="#0B0B0A" border={ink.hair} fadeAt={34} z={0} />
      <Window x={WIN.x} y={WIN.y} w={WIN.w} h={WIN.h} k={ramp(fr, 18, 44)} ry={5} rx={2} title="Claude Code — fixing another demo add-on (smart home) with Hearsay, no shell" tag={`REAL CLAUDE CODE SESSION · ${AGENT_UI_SPEED}×`}>
        <Rec clip={AGENT_UI} t={t} view={view} vw={WIN.w} vh={WIN.h}>
          <Hi at={at(AGENT_UI.before)} x={4} y={40} w={430} h={20} color={P.red} out={at(40)} stroke={4} />
          <Hi at={at(AGENT_UI.after) + 16} x={4} y={995} w={420} h={22} color={P.greenBright} stroke={4} />
          <Hi at={at(AGENT_UI.after) + 22} x={4} y={1109} w={262} h={22} stroke={4} />
        </Rec>
      </Window>
      <div style={{ position: 'absolute', left: 1340, top: 320, width: 500 }}>
        <Place x={0} y={0} at={start + 10}><Label>errors in the add-on</Label></Place>
        <div style={{ position: 'absolute', top: 36, opacity: ramp(fr, start + 10, start + 30) }}>
          <Odometer value={0} from={17} at={green - 22} dur={22} size={200} color={fr >= green ? P.greenBright : ink.fg} />
        </div>
        <Place x={0} y={300} at={w('agent', 17)}>
          <div style={{ fontFamily: display, fontSize: 50, fontWeight: 750, letterSpacing: '-0.03em', color: ink.fg, lineHeight: 1.05 }}>until the tests pass,</div>
          <div style={{ fontFamily: serif, fontSize: 60, color: P.orange, lineHeight: 1.05 }}><Words parts={[['without', w('agent', 21)], ['changing', w('agent', 22)], ['them.', w('agent', 23)]]} gap="0.2em" /></div>
        </Place>
        <Place x={0} y={470} at={at(AGENT_UI.after) + 20}>
          <div style={{ fontFamily: mono, fontSize: 19, color: ink.fg }}><span style={{ color: P.greenBright }}>✓</span> only src/ changed · suites/ untouched</div>
        </Place>
      </div>
    </>
  );
}

/** A padlock drawn in two strokes; the shackle drops shut on `shut`. */
function Lock({ x, y, at, shut, red }: { x: number; y: number; at: number; shut: number; red: number }) {
  const fr = useF();
  const ink = useInk();
  const drop = ramp(fr, shut, shut + 12, 0, 1, (q) => (q < 0.7 ? q / 0.7 : 1 - Math.sin((q - 0.7) * 10) * 0.05));
  const c = fr >= red ? P.red : ink.fg;
  const sy = y - 60 + 26 * drop;
  return (
    <Svg>
      <Draw d={`M ${x - 70} ${sy + 80} L ${x - 70} ${sy} A 70 70 0 0 1 ${x + 70} ${sy} L ${x + 70} ${sy + 50}`} at={at} dur={22} width={16} stroke={c} cap="butt" />
      <rect x={x - 115} y={y + 20} width={230} height={170} fill={c} opacity={ramp(fr, at + 6, at + 20)} />
      <circle cx={x} cy={y + 90} r={18} fill={ink.bg} opacity={ramp(fr, at + 10, at + 22)} />
    </Svg>
  );
}

export function Cheat() {
  const fr = useF();
  const ink = useInk();
  const w = cueOf('cheat');
  const t = fr / 60 - CLIP_AT.cheat;
  const out = sec(CLIP_AT.cheat + CLIPS.cheat.output);
  const view = track(fr, [[out, { x: 20, y: 20, w: 2800 }], [out + 20, { x: 20, y: 60, w: 3200 }]]);
  const caught = out + 6;
  const shake = fr >= caught ? Math.exp(-(fr - caught) / 7) * Math.sin(fr * 2.3) * 12 : 0;
  return (
    <>
      <div style={{ transform: `translateX(${shake}px)` }}><Lock x={330} y={330} at={-4} shut={w('cheat1', 7) - 6} red={caught} /></div>
      <div style={{ position: 'absolute', left: 96, top: 580, width: 480 }}>
        <div style={{ fontFamily: display, fontSize: 60, fontWeight: 800, letterSpacing: '-0.04em', color: ink.fg, lineHeight: 1 }}>
          <Words parts={[['It', w('cheat1', 1)], ['can’t', w('cheat1', 2)], ['cheat.', w('cheat1', 3)]]} />
        </div>
        <div style={{ fontFamily: serif, fontSize: 56, color: P.orange, marginTop: 8 }}><Words parts={[['your', w('cheat1', 4)], ['tests', w('cheat1', 5)], ['are', w('cheat1', 6)], ['locked', w('cheat1', 7)]]} gap="0.2em" /></div>
        <Place x={0} y={150} at={sec(0.6)}>
          <div style={{ fontFamily: mono, fontSize: 19, color: ink.muted, lineHeight: 1.5 }}>the test says <span style={{ color: ink.fg }}>15</span> · an agent, or anyone,<br />“fixes” it to <span style={{ color: P.red }}>50</span></div>
        </Place>
      </div>
      {/* In: the agent's window becomes the locked test's. */}
      <Morph from={{ x: WIN.x, y: WIN.y, w: WIN.w, h: WIN.h + 38 }} to={{ x: 640, y: 130, w: 1220, h: 758 }} a={0} b={24} fill="#0B0B0A" border={ink.hair} fadeAt={30} z={0} />
      <Window x={640} y={130} w={1220} h={720} k={ramp(fr, 14, 40)} ry={-5} rx={2} title="hearsay — a locked test, edited · 3rd demo add-on (kitchen timers)" tag="REAL RUN · REAL TIME" tagColor={P.red}>
        <Rec clip={CLIPS.cheat} t={t} view={view} vw={1220} vh={720}>
          <Hi at={sec(0.3)} x={625} y={83} w={1245} h={39} />
          <Hi at={out + 8} x={74} y={482} w={3045} h={40} color={P.red} />
          <Hi at={out + 20} x={74} y={839} w={1160} h={32} color={P.red} />
        </Rec>
      </Window>
      <Stamp at={w('cheat2', 4) + 4} x={1500} y={760} text="Run fails" sub="the tests changed since hearsay lock" size={96} rot={-4} />
    </>
  );
}
