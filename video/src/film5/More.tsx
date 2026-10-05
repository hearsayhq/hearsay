/**
 * For coding agents: Hearsay is an MCP server itself, with two Agent Skills, and a fresh Claude Code
 * session uses it to turn a flawed add-on green without touching the tests (the recorded session,
 * sped up and labelled). Then the locked tests that stop it from cheating (real run).
 */
import type { ReactNode } from 'react';
import { AGENT_SPEED, CLIPS, CLIP_AT, cue } from './plan';
import { C, Chip, Icon, Mark, mono, Pop, ramp, Rec, RecLabel, sans, sec, Stamp, stick, TermWindow, track, useF } from '../film4/kit';
import { Note } from './Demo';

const W = (scene: string) => (line: string, i: number) => cue(scene, line, i);
const WIN = { x: 160, y: 250, w: 1600, h: 680 };

function Box({ at, x, tint, icon, title, sub }: { at: number; x: number; tint: string; icon: string; title: string; sub: ReactNode }) {
  return (
    <Pop at={at} x={x} y={120}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '16px 24px', borderRadius: 22, background: `${tint}1f`, border: `2px solid ${tint}`, whiteSpace: 'nowrap' }}>
        <Icon name={icon} size={44} color={tint} />
        <div>
          <div style={{ fontFamily: sans, fontSize: 30, fontWeight: 800, color: C.text }}>{title}</div>
          <div style={{ fontFamily: sans, fontSize: 21, fontWeight: 600, color: C.muted, marginTop: 4 }}>{sub}</div>
        </div>
      </div>
    </Pop>
  );
}

export function Agent() {
  const fr = useF();
  const w = W('agent');
  const start = sec(CLIP_AT.agent);
  const t = Math.max(0, (fr - start) / 60) * AGENT_SPEED;
  const at = (clipSec: number) => start + Math.round((clipSec / AGENT_SPEED) * 60);
  const vh = (WIN.h * 3420) / WIN.w;
  const view = track(fr, [
    [at(80), { x: 0, y: 0, w: 3420 }],
    [at(100), { x: 0, y: 2484 - vh, w: 3420 }],
  ]);
  const win = stick(fr, start - 6, { damping: 15, stiffness: 140 });
  const link = ramp(fr, w('agent', 10) - 4, w('agent', 15) + 10);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Box at={w('agent', 0)} x={470} tint={C.amber} icon="server" title="Hearsay · also an MCP server" sub="+ Agent Skills for coding agents (not Alexa skills)" />
      <Box at={w('agent', 10)} x={1440} tint={C.blue} icon="agent" title="your coding agent" sub="here: Claude Code, a fresh session" />
      {link > 0 ? <div style={{ position: 'absolute', left: 860, top: 117, width: 210 * link, height: 6, borderRadius: 3, background: `linear-gradient(90deg, ${C.amber}, ${C.blue})`, boxShadow: '0 0 20px rgba(255,170,43,0.6)' }} /> : null}
      {fr >= start - 6 ? (
        <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - win) * 700}px)`, opacity: Math.min(1, win * 2) }}>
          <TermWindow title="claude — fixing another demo add-on (smart home) with Hearsay, no shell" w={WIN.w} h={WIN.h} style={{ left: WIN.x, top: WIN.y }}>
            <Rec clip={CLIPS.agent} t={t} view={view} vw={WIN.w} vh={WIN.h}>
              <Mark at={at(7.6)} x={24} y={64} w={1250} h={44} color={C.red} />
              <Mark at={at(CLIPS.agent.red)} x={120} y={572} w={1380} h={44} color={C.red} />
              <Mark at={at(CLIPS.agent.green)} x={120} y={1812} w={1400} h={44} color={C.green} />
              <Mark at={at(CLIPS.agent.untouched)} x={24} y={2352} w={760} h={44} />
            </Rec>
          </TermWindow>
          <RecLabel tint={C.amber} style={{ right: 1920 - WIN.x - WIN.w + 20, top: WIN.y + 64 }}>recorded session · {AGENT_SPEED}× speed</RecLabel>
        </div>
      ) : null}
      <Stamp at={at(CLIPS.agent.green) + 4} x={1360} y={560} text="Passes" color={C.green} size={84} rot={-6} />
      <Note at={at(CLIPS.agent.untouched) + 4} x={1330} y={820} tint={C.amber} rot={2}>only the add-on’s code changed · the tests untouched</Note>
    </div>
  );
}

export const agentFinePrint = 'Recorded with scripts/agent-loop.sh at main 3cc07c5, 5 Oct 2026, shown at 10× speed: 28 turns, 108 s, $0.75 API-equivalent on a subscription.';

export function Cheat() {
  const fr = useF();
  const w = W('cheat');
  const t = fr / 60 - CLIP_AT.cheat;
  const out = sec(CLIP_AT.cheat + CLIPS.cheat.output);
  const view = track(fr, [
    [out, { x: 20, y: 20, w: 2800 }],
    [out + 20, { x: 20, y: 60, w: 3200 }],
  ]);
  const caught = out + 6;
  const shake = fr >= caught ? Math.exp(-(fr - caught) / 7) * Math.sin(fr * 2.3) * 10 : 0;
  const red = ramp(fr, caught, caught + 8);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Pop at={w('cheat1', 4)} x={430} y={40} rot={-2}>
        <div style={{ transform: `translateX(${shake}px)` }}>
          <Chip tint={red > 0.5 ? C.red : C.amber} solid style={{ fontFamily: sans, fontWeight: 800, fontSize: 21 }}><Icon name="lock" size={24} color={C.ink} /> 3rd demo add-on: kitchen timers · tests locked</Chip>
        </div>
      </Pop>
      <TermWindow title="hearsay — someone edits a locked test" w={1600} h={860} glow={C.red} style={{ left: 160, top: 70 }}>
        <Rec clip={CLIPS.cheat} t={t} view={view} vw={1600} vh={860}>
          <Mark at={sec(2.4)} x={625} y={83} w={1245} h={39} />
          <Mark at={out + 8} x={74} y={482} w={3045} h={40} color={C.red} />
          <Mark at={out + 20} x={74} y={839} w={1160} h={32} color={C.red} />
        </Rec>
      </TermWindow>
      <Note at={sec(2.6)} x={1380} y={430} rot={2} out={out - 4}>the test says <b style={{ color: C.amber }}>15</b> · someone “fixes” it to <b style={{ color: '#FFB4B2' }}>50</b></Note>
      <Note at={out + 10} x={1200} y={760} tint={C.red} rot={-2} width={680}>
        the tests changed since they were locked, so the run fails
      </Note>
      <Stamp at={w('cheat2', 4) + 4} x={1440} y={330} text="Run fails" size={96} rot={8} />
    </div>
  );
}
