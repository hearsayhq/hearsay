/**
 * Try it, the intended way: open source and on npm, no keys, no account. Hearsay from npm in an
 * add-on's own project, one take (its test, one command, the result), the build step, the tagline
 * and the end card.
 */
import { interpolate } from 'remotion';
import { CLIPS, CLIP_AT, cue } from './plan';
import { C, Chip, GRAD, GRAD_TEXT, Icon, Mark, mono, Pop, ramp, Rec, RecLabel, sans, sec, squash, stick, TermWindow, useF } from '../film4/kit';
import { Note } from './Demo';

const W = (scene: string) => (line: string, i: number) => cue(scene, line, i);
const WIN = { x: 160, y: 150, w: 1600, h: 780 };
const LETTERS = 'HEARSAY'.split('');

export function Offer() {
  const fr = useF();
  const w = W('offer');
  const start = sec(CLIP_AT.npx);
  const t = fr / 60 - CLIP_AT.npx;
  const caseAt = start + sec(CLIPS.npx.case);
  const outAt = start + sec(CLIPS.npx.output);
  const tagAt = w('tag', 0);
  const win = stick(fr, start - 4, { damping: 15, stiffness: 140 });
  const winOut = ramp(fr, tagAt - 10, tagAt + 6, 0, 1, (x) => x * x);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {winOut < 1 ? (
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${1 - winOut * 0.7})`, opacity: 1 - winOut }}>
          {[
            { at: w('try', 2), text: 'open source · MIT', icon: 'check', x: 420 },
            { at: w('try', 5), text: 'on npm', icon: 'file', x: 780 },
            { at: w('try', 7), text: 'no keys, no account', icon: 'key', x: 1180 },
          ].map((x) => <Pop key={x.text} at={x.at} x={x.x} y={100}><Sticky at={x.at}><Icon name={x.icon} size={26} color={C.green} /> {x.text}</Sticky></Pop>)}
          {fr >= start - 4 ? (
            <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - win) * 800}px)`, opacity: Math.min(1, win * 2) }}>
              <TermWindow title="your add-on’s project · Hearsay from npm · one take" w={WIN.w} h={WIN.h} glow={C.green} style={{ left: WIN.x, top: WIN.y }}>
                <Rec clip={CLIPS.npx} t={t} view={{ x: 0, y: 0, w: 2700 }} vw={WIN.w} vh={WIN.h}>
                  <Mark at={caseAt + 10} x={150} y={170} w={1100} h={46} color={C.amber} />
                  <Mark at={outAt - 30} x={60} y={400} w={1560} h={50} color={C.blue} />
                  <Mark at={outAt + 10} x={60} y={682} w={1300} h={50} color={C.green} />
                </Rec>
              </TermWindow>
              <RecLabel tint={C.text} style={{ right: 1920 - WIN.x - WIN.w + 20, top: WIN.y + 64 }}>real run · real time</RecLabel>
              <Note at={caseAt + 14} x={1460} y={330} tint={C.amber} rot={2} width={480} out={outAt - 20}>what a customer says, and what should happen: your test</Note>
              <Note at={w('try', 20)} x={1440} y={790} tint={C.green} rot={-2} width={560}>
                <div style={{ fontFamily: mono, fontSize: 18, color: C.green, marginBottom: 8 }}>IN YOUR BUILD, ONE STEP</div>
                <div style={{ fontFamily: mono, fontSize: 22 }}>- run: npx -y @hearsayhq/cli run suites/*.yaml</div>
              </Note>
            </div>
          ) : null}
        </div>
      ) : null}
      <Tagline at={tagAt} />
    </div>
  );
}

function Sticky({ at, children }: { at: number; children: React.ReactNode }) {
  const fr = useF();
  const { k, sx, sy } = squash(fr, at);
  return (
    <div style={{ transform: `scale(${k * sx},${k * sy})`, display: 'flex', alignItems: 'center', gap: 10, fontFamily: sans, fontSize: 28, fontWeight: 800, color: C.text, padding: '10px 22px', borderRadius: 16, background: 'rgba(12,15,30,0.72)', border: `2px solid ${C.green}`, whiteSpace: 'nowrap' }}>
      {children}
    </div>
  );
}

/** The tagline, then the end card. */
function Tagline({ at }: { at: number }) {
  const fr = useF();
  const w = W('offer');
  if (fr < at - 4) return null;
  const card = w('tag', 6) + 30;
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
          <div style={{ fontFamily: sans, fontSize: 44, fontWeight: 700, color: C.text }}>Preflight checks for <span style={GRAD_TEXT}>Alexa+ add-ons</span></div>
          <div style={{ display: 'flex', gap: 22 }}>
            <Chip tint={C.text} style={{ fontSize: 32, padding: '12px 26px' }}>github.com/hearsayhq/hearsay</Chip>
            <Chip tint={C.amber} style={{ fontSize: 32, padding: '12px 26px' }}>npx @hearsayhq/cli</Chip>
          </div>
          <div style={{ fontFamily: sans, fontSize: 28, fontWeight: 600, color: C.muted, opacity: ramp(fr, card + 30, card + 44) }}>for coding agents: npx @hearsayhq/mcp · open source · MIT</div>
        </div>
      ) : null}
    </div>
  );
}
