/**
 * The offer: the price (zero, open source), a fresh clone that installs and runs green in one take
 * (install at 2×, labelled; the run at real time), the tagline and the end card.
 */
import { interpolate } from 'remotion';
import { CLIPS, CLIP_AT, cue, INSTALL_SPEED } from './plan';
import { C, Chip, GRAD, GRAD_TEXT, Icon, Mark, mono, Pop, ramp, Rec, RecLabel, sans, sec, squash, stick, TermWindow, track, useF } from './kit';
import { Seal } from './Demo';

const W = (scene: string) => (line: string, i: number) => cue(scene, line, i);
const WIN = { x: 160, y: 110, w: 1600, h: 820 };
const LETTERS = 'HEARSAY'.split('');

export function Offer() {
  const fr = useF();
  const w = W('offer');
  const zero = w('offer', 3);
  const clone = w('offer', 12);
  const start = sec(CLIP_AT.clone);
  const fast = CLIPS.clone.installed / INSTALL_SPEED;
  const s = fr / 60 - CLIP_AT.clone;
  const t = s <= fast ? s * INSTALL_SPEED : CLIPS.clone.installed + (s - fast);
  const outAt = start + sec(fast + (CLIPS.clone.output - CLIPS.clone.installed));
  const tagAt = w('tag', 0);
  const view = track(fr, [
    [outAt, { x: 20, y: 20, w: 2900 }],
    [outAt + 26, { x: 20, y: 1050 - (1800 * WIN.h) / WIN.w / 2, w: 1800 }],
  ]);
  // The price tag swings in on a string and settles.
  const swing = fr >= 0 ? 24 * Math.exp(-fr / 40) * Math.cos(fr / 7) : 0;
  const drop = stick(fr, 0, { damping: 13, stiffness: 120 });
  const flip = ramp(fr, zero - 8, zero + 4, 0, 180);
  const up = stick(fr, clone - 8, { damping: 16, stiffness: 140 });
  const win = stick(fr, start - 4, { damping: 15, stiffness: 140 });
  const winOut = ramp(fr, tagAt - 10, tagAt + 6, 0, 1, (x) => x * x);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {fr < start + 30 ? (
        <div style={{ position: 'absolute', inset: 0, transform: `translateY(${-up * 900}px)`, opacity: 1 - up }}>
          <div style={{ position: 'absolute', left: 960, top: -20, width: 4, height: 330 * drop, background: 'rgba(255,255,255,0.4)', transformOrigin: 'top', transform: `rotate(${swing}deg)` }} />
          <div style={{ position: 'absolute', left: 960, top: -20, transformOrigin: 'top center', transform: `rotate(${swing}deg)` }}>
            <div style={{ position: 'absolute', left: -230, top: 300 * drop, width: 460, height: 250, perspective: 1200 }}>
              <div style={{ position: 'absolute', inset: 0, transform: `rotateY(${flip}deg)`, transformStyle: 'preserve-3d' }}>
                {[0, 1].map((side) => (
                  <div key={side} style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: side ? 'rotateY(180deg)' : undefined, borderRadius: 30, background: side ? GRAD : 'rgba(14,16,32,0.92)', border: side ? 'none' : '3px solid #FF8A6B', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 40px 90px rgba(0,0,0,0.5)' }}>
                    <div style={{ position: 'absolute', top: 22, left: '50%', width: 26, height: 26, marginLeft: -13, borderRadius: 13, background: C.ink, border: '3px solid rgba(255,255,255,0.4)' }} />
                    <div style={{ fontFamily: sans, fontSize: side ? 150 : 110, fontWeight: 900, color: side ? '#0b0d18' : '#FF9A6B', marginTop: 30, letterSpacing: -4 }}>{side ? '$0' : '$ ???'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 650, display: 'flex', justifyContent: 'center', gap: 24 }}>
            {[
              { at: w('offer', 6), text: 'open source', icon: 'check' },
              { at: w('offer', 7) + 6, text: 'MIT license', icon: 'file' },
            ].map((x) => fr >= x.at ? <Sticky key={x.text} at={x.at}><Icon name={x.icon} size={30} color={C.green} /> {x.text}</Sticky> : null)}
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 760, display: 'flex', justifyContent: 'center', gap: 24 }}>
            {[
              { at: w('offer', 8), text: 'no API keys', icon: 'key' },
              { at: w('offer', 10), text: 'no account', icon: 'user' },
            ].map((x) => fr >= x.at ? <Sticky key={x.text} at={x.at} crossed><Icon name={x.icon} size={30} color={C.red} /> {x.text}</Sticky> : null)}
          </div>
        </div>
      ) : null}
      {fr >= start - 4 && winOut < 1 ? (
        <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - win) * 800}px) scale(${1 - winOut * 0.7})`, opacity: Math.min(1, win * 2) * (1 - winOut) }}>
          <TermWindow title="a fresh clone — bash — one take" w={WIN.w} h={WIN.h} glow={C.green} style={{ left: WIN.x, top: WIN.y }}>
            <Rec clip={CLIPS.clone} t={t} view={view} vw={WIN.w} vh={WIN.h}>
              <Mark at={start + sec(fast) - 4} x={70} y={297} w={540} h={36} color={C.blue} />
              <Mark at={outAt + 10} x={70} y={1002} w={1120} h={30} color={C.green} />
              <Mark at={outAt + 18} x={70} y={1086} w={135} h={30} color={C.green} />
            </Rec>
          </TermWindow>
          <RecLabel tint={s <= fast ? C.amber : C.text} style={{ right: 1920 - WIN.x - WIN.w + 20, top: WIN.y + 64 }}>{s <= fast ? `clone + install · ${INSTALL_SPEED}× speed` : 'the run · real time'}</RecLabel>
        </div>
      ) : null}
      {[
        { at: clone, text: 'git clone' },
        { at: w('offer', 14), text: 'npm ci' },
        { at: w('offer', 16), text: 'npm run hearsay -- run suites/kitchen.yaml' },
      ].map((x, i) => <Pop key={x.text} at={x.at} out={tagAt - 10} x={[330, 640, 1230][i]!} y={52} rot={i % 2 ? 2 : -2}><Chip tint={C.green} solid style={{ fontSize: 24 }}>{x.text}</Chip></Pop>)}
      <Tagline at={tagAt} />
    </div>
  );
}

function Sticky({ at, crossed, children }: { at: number; crossed?: boolean; children: React.ReactNode }) {
  const fr = useF();
  const { k, sx, sy } = squash(fr, at);
  return (
    <div style={{ position: 'relative', transform: `scale(${k * sx},${k * sy}) rotate(${(1 - k) * 12}deg)`, display: 'flex', alignItems: 'center', gap: 12, fontFamily: sans, fontSize: 34, fontWeight: 800, color: C.text, padding: '14px 28px', borderRadius: 18, background: 'rgba(12,15,30,0.62)', border: `2px solid ${crossed ? C.red : C.green}` }}>
      {children}
    </div>
  );
}

/** The tagline, then the end card. */
function Tagline({ at }: { at: number }) {
  const fr = useF();
  const w = W('offer');
  if (fr < at - 4) return null;
  const card = w('tag', 6) + 40;
  const rise = stick(fr, card, { damping: 18, stiffness: 120 });
  const words = ['Hear', 'it', 'before', 'your', 'customers', 'do.'];
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', left: 960, top: interpolate(rise, [0, 1], [420, 250]), transform: `translate(-50%,-50%) scale(${interpolate(rise, [0, 1], [1, 0.62])})` }}>
        <div style={{ position: 'relative', display: 'flex' }}>
          {LETTERS.map((ch, i) => {
            const a = at - 4 + i * 2;
            if (fr < a) return <span key={i} style={{ fontFamily: sans, fontSize: 230, fontWeight: 900, letterSpacing: -6, opacity: 0 }}>{ch}</span>;
            const { k, sx, sy } = squash(fr, a, 2.2);
            return <span key={i} style={{ display: 'inline-block', fontFamily: sans, fontSize: 230, fontWeight: 900, letterSpacing: -6, color: C.text, transform: `translateY(${(1 - k) * -260}px) scale(${sx},${sy})`, transformOrigin: 'bottom' }}>{ch}</span>;
          })}
        </div>
        <div style={{ position: 'absolute', left: '50%', bottom: -14, height: 18, borderRadius: 9, background: GRAD, width: `${100 * stick(fr, at + 4, { damping: 18 })}%`, transform: 'translateX(-50%)', boxShadow: '0 0 60px rgba(255,94,138,0.55)' }} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: interpolate(rise, [0, 1], [610, 400]), display: 'flex', justifyContent: 'center', gap: 18 }}>
        {words.map((x, i) => {
          const a = w('tag', i + 1) - 2;
          const k = fr >= a ? stick(fr, a) : 0;
          return <span key={x} style={{ display: 'inline-block', fontFamily: sans, fontSize: 64, fontWeight: 800, color: C.text, ...(i === 4 ? GRAD_TEXT : {}), opacity: Math.min(1, k * 2), transform: `translateY(${(1 - k) * 40}px)` }}>{x}</span>;
        })}
      </div>
      {fr >= card ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 520, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26, opacity: ramp(fr, card + 6, card + 20) }}>
          <div style={{ fontFamily: sans, fontSize: 40, fontWeight: 600, color: C.muted }}>Preflight checks for Alexa+ MCP servers</div>
          <div style={{ display: 'flex', gap: 22 }}>
            <Chip tint={C.text} style={{ fontSize: 32, padding: '12px 26px' }}>github.com/hearsayhq/hearsay</Chip>
            <Chip tint={C.amber} style={{ fontSize: 32, padding: '12px 26px' }}>npx @hearsayhq/cli</Chip>
          </div>
          <div style={{ fontFamily: sans, fontSize: 30, fontWeight: 700, color: C.text, opacity: ramp(fr, card + 30, card + 44) }}>Your coding agent is standing by.</div>
        </div>
      ) : null}
      <Seal at={card + 50} x={1640} y={250} size={250} />
    </div>
  );
}
