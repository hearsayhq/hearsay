/**
 * "But wait, there's more": Hearsay as an MCP server in a coding agent's loop (the recorded session,
 * sped up and labelled), the locked suite that stops it from cheating (real run), and the
 * experiment's numbers with their limits in the fine print (docs/15).
 */
import { AGENT_SPEED, CLIPS, CLIP_AT, cue } from './plan';
import { C, Chip, GRAD_TEXT, Icon, Mark, mono, Pop, ramp, Rec, RecLabel, sans, sec, Stamp, Starburst, stick, TermWindow, track, useF } from './kit';
import { Note } from './Demo';

const W = (scene: string) => (line: string, i: number) => cue(scene, line, i);
const WIN = { x: 160, y: 150, w: 1600, h: 780 };

export function More() {
  const fr = useF();
  const w = W('more');
  const start = sec(CLIP_AT.agent);
  const t = Math.max(0, (fr - start) / 60) * AGENT_SPEED;
  const at = (clipSec: number) => start + Math.round((clipSec / AGENT_SPEED) * 60);
  const burstIn = stick(fr, w('more1', 0) - 6, { damping: 12, stiffness: 170 });
  const burstOut = ramp(fr, start - 10, start + 8, 0, 1, (x) => x * x);
  const vh = (WIN.h * 2800) / WIN.w;
  const view = track(fr, [
    [at(14), { x: 0, y: 0, w: 2800 }],
    [at(30), { x: 0, y: 330, w: 2800 }],
    [at(52), { x: 0, y: 700, w: 2800 }],
    [at(62), { x: 0, y: 2484 - vh, w: 2800 }],
  ]);
  const win = stick(fr, start - 6, { damping: 15, stiffness: 140 });
  const link = ramp(fr, w('more1', 8) - 4, w('more1', 8) + 14);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {burstOut < 1 ? (
        <div style={{ position: 'absolute', left: 960, top: 500, transform: `translate(-50%,-50%) scale(${burstIn * (1 - burstOut)})` }}>
          <Starburst size={1300} points={26} inner={0.86} spin={fr * 0.4} fill="grad">
            <div style={{ fontFamily: sans, fontSize: 130, fontWeight: 900, color: C.ink, lineHeight: 0.95, transform: `scale(${fr >= w('more1', 0) ? stick(fr, w('more1', 0)) : 0})` }}>BUT WAIT —</div>
            <div style={{ fontFamily: sans, fontSize: 150, fontWeight: 900, color: C.ink, lineHeight: 0.95, transform: `scale(${fr >= w('more1', 2) ? stick(fr, w('more1', 2)) : 0}) rotate(-3deg)` }}>THERE’S MORE!</div>
          </Starburst>
        </div>
      ) : null}
      {fr >= start - 6 ? (
        <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - win) * 700}px) rotate(${(1 - win) * 6}deg)`, opacity: Math.min(1, win * 2) }}>
          <TermWindow title="claude — a fresh session with Hearsay's MCP server, no shell" w={WIN.w} h={WIN.h} style={{ left: WIN.x, top: WIN.y }}>
            <Rec clip={CLIPS.agent} t={t} view={view} vw={WIN.w} vh={WIN.h}>
              <Mark at={at(13.9)} x={120} y={631} w={1275} h={38} color={C.red} />
              <Mark at={at(59.25)} x={120} y={1441} w={1300} h={38} color={C.green} />
              <Mark at={at(62.2)} x={24} y={2034} w={745} h={33} />
            </Rec>
          </TermWindow>
          <RecLabel tint={C.amber} style={{ right: 1920 - WIN.x - WIN.w + 20, top: WIN.y + 64 }}>recorded session · {AGENT_SPEED}× speed</RecLabel>
        </div>
      ) : null}
      <Pop at={w('more1', 4)} x={560} y={74} rot={-2}><Chip tint={C.amber} solid style={{ fontFamily: sans, fontWeight: 800, fontSize: 26 }}>Hearsay · MCP server</Chip></Pop>
      <Pop at={w('more1', 10)} x={1360} y={74} rot={2}><Chip tint={C.blue} solid style={{ fontFamily: sans, fontWeight: 800, fontSize: 26 }}><Icon name="agent" size={26} color={C.ink} /> your coding agent</Chip></Pop>
      {link > 0 ? <div style={{ position: 'absolute', left: 790, top: 72, width: 400 * link, height: 6, borderRadius: 3, background: `linear-gradient(90deg, ${C.amber}, ${C.blue})`, boxShadow: '0 0 20px rgba(255,170,43,0.6)' }} /> : null}
      <Stamp at={at(59.4)} x={1360} y={560} text="Green" color={C.green} size={84} rot={-6} />
      <Note at={at(62.4)} x={1330} y={790} tint={C.amber} rot={2}>only <span style={{ fontFamily: mono }}>src/server.ts</span> changed · suites untouched</Note>
    </div>
  );
}

export function Cheat() {
  const fr = useF();
  const w = W('cheat');
  const t = fr / 60 - CLIP_AT.cheat;
  const out = sec(CLIP_AT.cheat + CLIPS.cheat.output);
  const view = track(fr, [
    [out, { x: 20, y: 20, w: 2800 }],
    [out + 20, { x: 20, y: 60, w: 3200 }],
  ]);
  const caught = w('cheat2', 0);
  const shake = fr >= caught ? Math.exp(-(fr - caught) / 7) * Math.sin(fr * 2.3) * 10 : 0;
  const red = ramp(fr, caught, caught + 8);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Pop at={w('cheat1', 0) + 2} x={420} y={40} rot={-2}>
        <div style={{ transform: `translateX(${shake}px)` }}>
          <Chip tint={red > 0.5 ? C.red : C.amber} solid style={{ fontFamily: sans, fontWeight: 800, fontSize: 24 }}><Icon name="lock" size={26} color={C.ink} /> suites/kitchen.yaml · locked</Chip>
        </div>
      </Pop>
      <TermWindow title="hearsay — bash — editing a locked test" w={1600} h={860} glow={C.red} style={{ left: 160, top: 70 }}>
        <Rec clip={CLIPS.cheat} t={t} view={view} vw={1600} vh={860}>
          <Mark at={w('cheat1', 4)} x={625} y={83} w={1245} h={39} />
          <Mark at={out + 8} x={74} y={482} w={3045} h={40} color={C.red} />
          <Mark at={out + 20} x={74} y={839} w={1160} h={32} color={C.red} />
          <Mark at={out + 26} x={74} y={930} w={140} h={30} color={C.red} />
        </Rec>
      </TermWindow>
      <Note at={w('cheat1', 4) + 6} x={1380} y={430} rot={2}>the test says <b style={{ color: C.amber }}>15</b> · “fixed” to <b style={{ color: '#FFB4B2' }}>50</b></Note>
      <Note at={out + 10} x={1200} y={760} tint={C.red} rot={-2} width={640}>
        <div style={{ fontFamily: mono, fontSize: 20, color: C.red, marginBottom: 6 }}>suite.integrity · error</div>
        changed since it was locked: this run cannot count as green
      </Note>
      <Stamp at={caught + 4} x={1440} y={330} text="Nice try" size={96} rot={8} />
    </div>
  );
}

function Bar({ at, value, label, text, tint, width = 640 }: { at: number; value: number; label: string; text: string; tint: string; width?: number }) {
  const fr = useF();
  const k = ramp(fr, at, at + 40);
  return (
    <div style={{ marginBottom: 18, opacity: ramp(fr, at - 6, at + 6) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: sans, fontSize: 24, color: C.text, marginBottom: 8, width }}><span>{label}</span><b style={{ color: tint }}>{text}</b></div>
      <div style={{ width, height: 22, borderRadius: 11, background: 'rgba(255,255,255,0.07)' }}><div style={{ width: `${value * 100 * k}%`, height: '100%', borderRadius: 11, background: tint }} /></div>
    </div>
  );
}

export function Proof() {
  const fr = useF();
  const w = W('proof');
  const zero = w('proof', 25);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Pop at={w('proof', 0)} x={960} y={95}><div style={{ fontFamily: sans, fontSize: 66, fontWeight: 900, color: C.text, whiteSpace: 'nowrap', letterSpacing: -1 }}>We measured it with coding agents.</div></Pop>
      <Pop at={w('proof', 6) - 4} x={500} y={330} rot={-1}>
        <div style={{ width: 760, padding: '26px 32px', borderRadius: 24, background: 'rgba(12,15,30,0.62)', border: '1.5px solid rgba(255,255,255,0.16)' }}>
          <div style={{ fontFamily: sans, fontSize: 32, fontWeight: 800, color: C.text, marginBottom: 18 }}>A suite alone: agents stopped at green</div>
          <Bar at={w('proof', 9)} value={0.682} label="unseen cases passed · suite only" text="68 %" tint={C.green} width={690} />
          <Bar at={w('proof', 11)} value={0.829} label="a precise prompt, no Hearsay" text="83 %" tint={C.muted} width={690} />
        </div>
      </Pop>
      <Pop at={w('proof', 15)} x={1400} y={330} rot={1}>
        <div style={{ width: 760, padding: '26px 32px', borderRadius: 24, background: 'rgba(12,15,30,0.62)', border: `1.5px solid ${C.amber}` }}>
          <div style={{ fontFamily: sans, fontSize: 32, fontWeight: 800, color: C.text, marginBottom: 16 }}>So Hearsay now shows what your suite doesn’t cover</div>
          <div style={{ fontFamily: mono, fontSize: 21, color: C.text, lineHeight: 1.5, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,170,43,0.10)' }}>
            <span style={{ color: C.amber }}>! coverage.values</span> warn<br />orders_stage_cart.amountUsd: no case tries a value outside 0.5–500
          </div>
        </div>
      </Pop>
      {fr >= zero - 6 ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 540, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 120 }}>
          <div style={{ textAlign: 'center', transform: `scale(${stick(fr, zero - 6)})` }}>
            <div style={{ fontFamily: sans, fontSize: 190, fontWeight: 900, lineHeight: 0.9, letterSpacing: -6, ...GRAD_TEXT }}>0 <span style={{ fontSize: 90, letterSpacing: -2 }}>of 36</span></div>
            <div style={{ fontFamily: sans, fontSize: 26, fontWeight: 600, color: C.text, marginTop: 12 }}>agent runs with Hearsay left errors behind*</div>
          </div>
          <div style={{ textAlign: 'center', transform: `scale(${stick(fr, zero + 10)})`, opacity: 0.85 }}>
            <div style={{ fontFamily: sans, fontSize: 120, fontWeight: 900, color: C.muted, lineHeight: 0.9, letterSpacing: -4 }}>11 <span style={{ fontSize: 64 }}>of 27</span></div>
            <div style={{ fontFamily: sans, fontSize: 26, fontWeight: 600, color: C.muted, marginTop: 12 }}>without Hearsay</div>
          </div>
        </div>
      ) : null}
      <Pop at={w('proof', 30) - 2} x={960} y={880}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '14px 28px', borderRadius: 999, background: 'rgba(255,170,43,0.12)', border: `2px solid ${C.amber}`, fontFamily: sans, fontSize: 30, fontWeight: 700, color: C.text }}>
          rules nobody told them about: <b style={{ color: C.amber, fontSize: 40 }}>37/45</b> <span style={{ color: C.muted }}>vs 28/45</span>
        </div>
      </Pop>
    </div>
  );
}

export const proofFinePrint = '*Agent runs that ended with errors the suite shows. 3 runs per arm, 3 flawed add-ons, claude-sonnet-5-5. Unseen cases written by the author of the flaws. On unseen cases the current version is level with a precise prompt (83.7 % vs 82.9 %); three of the four Hearsay arms counted in the 36 did worse. docs/15.';
export const agentFinePrint = 'Recorded with scripts/agent-loop.sh, shown at 10× speed. Cost shown is API-equivalent; the run was on a subscription.';
