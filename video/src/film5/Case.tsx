/**
 * The first two scenes. The use case: a grocery add-on for Alexa+, a customer who says fifteen,
 * an assistant that (say) hears fifty, and an add-on that answers "Added." (the flawed build's real
 * reply), spoken by Amazon Polly. Then what Hearsay is: preflight checks for Alexa+ add-ons, which
 * are MCP servers, played clean and misheard: a real run in Hearsay's console.
 */
import type { ReactNode } from 'react';
import { interpolate } from 'remotion';
import { CLIPS, cue, pollyAt, POLLY } from './plan';
import { C, Chip, GLASS, GRAD, GRAD_TEXT, Icon, Mark, mono, Pop, ramp, Rec, RecLabel, sans, squash, stick, track, useF } from '../film4/kit';
import type { View } from '../film4/kit';
import { Melt } from '../film4/Open';

const W = (scene: string) => (line: string, i: number) => cue(scene, line, i);
const pollyLen = (id: string) => Math.round(POLLY.find((p) => p.id === id)!.seconds * 60);

/** Sound bars that move while someone speaks. */
export function Waves({ from, len, color, size = 1 }: { from: number; len: number; color: string; size?: number }) {
  const fr = useF();
  const on = fr >= from && fr < from + len;
  const bars = [0.5, 0.9, 0.6, 1, 0.7, 0.45];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 * size, height: 34 * size }}>
      {bars.map((b, i) => {
        const h = on ? 8 + 26 * b * Math.abs(Math.sin((fr - from) / (3 + i) + i)) : 6;
        return <div key={i} style={{ width: 5 * size, height: h * size, borderRadius: 3, background: color, opacity: on ? 1 : 0.4 }} />;
      })}
    </div>
  );
}

/** A spoken line, as a bubble: who says it, the words, and the bars while it plays. */
function Bubble({ at, x, y, who, icon, tint, len, align = 'left', children }: { at: number; x: number; y: number; who: string; icon: string; tint: string; len: number; align?: 'left' | 'right'; children: ReactNode }) {
  const fr = useF();
  if (fr < at - 6) return null;
  const { k, sx, sy } = squash(fr, at - 6);
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(${align === 'right' ? '-100%' : '0'}, 0) scale(${k * sx},${k * sy})`, transformOrigin: align === 'right' ? 'right center' : 'left center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
        <Icon name={icon} size={30} color={tint} />
        <div style={{ fontFamily: mono, fontSize: 20, letterSpacing: 2, color: tint }}>{who}</div>
        <Waves from={at} len={len} color={tint} size={0.8} />
      </div>
      <div style={{ ...GLASS, borderRadius: 26, padding: '22px 30px', border: `2px solid ${tint}`, fontFamily: sans, fontSize: 46, fontWeight: 700, color: C.text, whiteSpace: 'nowrap' }}>{children}</div>
    </div>
  );
}

export function Case() {
  const fr = useF();
  const w = W('case');
  const customer = pollyAt('p5-customer');
  const flawed = pollyAt('p5-flawed');
  const hears = w('case2', 3);
  const noticed = w('case3', 4);
  const typed = w('case3', 7);
  const example = w('open', 16) - 4;
  const title = fr >= example ? stick(fr, example, { damping: 15, stiffness: 140 }) : 0;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Opening out={example} />
      {fr >= example ? (
        <div style={{ position: 'absolute', left: 120, top: 70, transform: `translateY(${(1 - title) * -40}px)`, opacity: Math.min(1, title * 2) }}>
          <Chip tint={C.amber} solid style={{ fontFamily: sans, fontWeight: 900, fontSize: 24, letterSpacing: 3 }}>AN EXAMPLE</Chip>
          <div style={{ fontFamily: sans, fontSize: 64, fontWeight: 900, color: C.text, letterSpacing: -1, marginTop: 12 }}>A grocery add-on for <span style={GRAD_TEXT}>Alexa+</span></div>
        </div>
      ) : null}
      <Pop at={w('case1', 3)} x={1540} y={300}>
        <div style={{ width: 380, padding: '26px 28px', borderRadius: 26, background: 'rgba(142,162,255,0.12)', border: `2px solid ${C.blue}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Icon name="server" size={60} color={C.blue} />
          <div style={{ fontFamily: sans, fontSize: 34, fontWeight: 800, color: C.text }}>your add-on</div>
          <Chip tint={C.blue} style={{ fontSize: 18, padding: '4px 12px' }}>groceries · up to $50 a day</Chip>
        </div>
      </Pop>
      <Bubble at={customer} x={120} y={300} who="CUSTOMER SAYS" icon="user" tint={C.amber} len={pollyLen('p5-customer')}>“Add fifteen dollars of fruit.”</Bubble>
      {fr >= hears - 4 ? (
        <div style={{ position: 'absolute', left: 120, top: 520, opacity: ramp(fr, hears - 4, hears + 6), display: 'flex', alignItems: 'center', gap: 18 }}>
          <Chip tint={C.red} solid style={{ fontFamily: sans, fontWeight: 800, fontSize: 22 }}>say the assistant hears</Chip>
          <div style={{ fontFamily: sans, fontSize: 46, fontWeight: 700, color: C.text }}>“Add <Melt from="fifteen" to="fifty" at={w('case2', 4) - 2} size={46} color={C.text} /> dollars of fruit.”</div>
        </div>
      ) : null}
      <Bubble at={flawed} x={1800} y={600} who="YOUR ADD-ON RETURNS" icon="speaker" tint={C.blue} len={pollyLen('p5-flawed')} align="right">“Added.”</Bubble>
      {fr >= noticed - 8 ? (
        <Pop at={noticed - 8} x={1075} y={760} rot={-2}>
          <div style={{ ...GLASS, borderRadius: 22, padding: '18px 28px', border: `2px solid ${C.red}`, display: 'flex', alignItems: 'center', gap: 26, fontFamily: sans, fontSize: 34, fontWeight: 700, color: C.text }}>
            <span style={{ fontFamily: mono, fontSize: 18, color: C.muted, letterSpacing: 2 }}>CART</span>
            <span>milk · $7.40</span>
            <span style={{ color: '#FFB4B2' }}>fruit · <b>$50.00</b></span>
            <span style={{ color: '#FFB4B2' }}>= <b>$57.40</b></span>
          </div>
        </Pop>
      ) : null}
      {/* The suite's numbers: milk ($7.40) is staged first, so fifty more passes the $50 budget. */}
      <Pop at={noticed + 10} x={1215} y={852} rot={-2}><Chip tint={C.red} solid style={{ fontFamily: sans, fontWeight: 800, fontSize: 22 }}>over the $50 budget</Chip></Pop>
      <Pop at={typed} x={360} y={760} rot={2}>
        <div style={{ ...GLASS, borderRadius: 20, padding: '14px 22px', fontFamily: sans, fontSize: 26, color: C.text, opacity: 0.92 }}>
          <div style={{ fontFamily: mono, fontSize: 16, color: C.muted, letterSpacing: 2, marginBottom: 8 }}>TESTED BY TYPING</div>
          <div>“Add $15 of fruit” → “Added.” <span style={{ color: C.green }}>✓ fine</span></div>
        </div>
      </Pop>
    </div>
  );
}

const LETTERS = 'HEARSAY'.split('');

/** The first sentence: what Hearsay is, before the example. */
function Opening({ out }: { out: number }) {
  const fr = useF();
  const w = W('case');
  const hit = w('open', 2) - 3;
  const gone = ramp(fr, out - 6, out + 10);
  if (gone >= 1) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 1 - gone, transform: `scale(${1 - 0.15 * gone})` }}>
      <div style={{ position: 'absolute', left: 960, top: 400, transform: 'translate(-50%,-50%)' }}>
        <div style={{ position: 'relative', display: 'flex' }}>
          {LETTERS.map((ch, i) => {
            const at = hit + i * 2;
            if (fr < at) return <span key={i} style={{ fontFamily: sans, fontSize: 230, fontWeight: 900, letterSpacing: -6, opacity: 0 }}>{ch}</span>;
            const { k, sx, sy } = squash(fr, at, 2.2);
            return <span key={i} style={{ display: 'inline-block', fontFamily: sans, fontSize: 230, fontWeight: 900, letterSpacing: -6, color: C.text, transform: `translateY(${(1 - k) * -200}px) scale(${sx},${sy})`, transformOrigin: 'bottom' }}>{ch}</span>;
          })}
        </div>
        {fr >= hit ? <div style={{ position: 'absolute', left: '50%', bottom: -14, height: 18, borderRadius: 9, background: GRAD, width: `${100 * stick(fr, hit, { damping: 18 })}%`, transform: 'translateX(-50%)', boxShadow: '0 0 60px rgba(255,94,138,0.55)' }} /> : null}
      </div>
      {fr >= hit + 8 ? <div style={{ position: 'absolute', left: 0, right: 0, top: 590, textAlign: 'center', opacity: ramp(fr, hit + 8, hit + 20), fontFamily: sans, fontSize: 60, fontWeight: 800, color: C.text }}>Preflight checks for <span style={GRAD_TEXT}>Alexa+ add-ons</span></div> : null}
      <Pop at={w('open', 4)} x={960} y={720}><Chip tint={C.amber} style={{ fontFamily: sans, fontWeight: 800, fontSize: 28, padding: '10px 24px' }}>a crash test, so they don’t go wrong out loud</Chip></Pop>
    </div>
  );
}

/** Hearsay's console in a browser window: where it sits, and the views of the recording it shows. */
const CON = { x: 110, y: 268, w: 1400, h: 660 };
const CON_TOP: View = { x: 600, y: 40, w: 2640 };
const CON_RUNS: View = { x: 1120, y: 600, w: 2060 };

export function What() {
  const fr = useF();
  const w = W('what');
  // Hearsay was introduced in the opening: here the wordmark is already standing.
  const hit = -80;
  const mcp = w('what', 7) - 4;
  const tools = w('what', 9) - 2;
  const yours = w('what', 22) - 2;
  const mis = w('what', 37) - 2;
  const checks = w('what', 38) - 2;
  const fails = w('what', 42) - 2;
  const up = stick(fr, mcp - 10, { damping: 16, stiffness: 140 });
  const markY = interpolate(up, [0, 1], [380, 170]);
  const markS = interpolate(up, [0, 1], [1, 0.5]);
  // The console run, in real time: its "Run suite" click lands on "Hearsay plays".
  const shift = w('what', 28) / 60 - 0.1 - CLIPS.console.run;
  const con = (clipSec: number) => Math.round((shift + clipSec) * 60);
  const t = fr / 60 - shift;
  const enter = con(1.9);
  const win = stick(fr, enter, { damping: 16, stiffness: 140 });
  const card = 1 - ramp(fr, enter - 12, enter + 6);
  const view = track(fr, [
    [enter, CON_TOP],
    [con(CLIPS.console.runs) - 2, CON_TOP],
    [con(CLIPS.console.runs) + 14, CON_RUNS],
    [con(CLIPS.console.top) - 2, CON_RUNS],
    [con(CLIPS.console.top) + 14, CON_TOP],
  ]);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', left: 960, top: markY, transform: `translate(-50%,-50%) scale(${markS})` }}>
        <div style={{ position: 'relative', display: 'flex' }}>
          {LETTERS.map((ch, i) => {
            const at = hit + i * 2;
            if (fr < at) return <span key={i} style={{ fontFamily: sans, fontSize: 230, fontWeight: 900, letterSpacing: -6, opacity: 0 }}>{ch}</span>;
            const { k, sx, sy } = squash(fr, at, 2.2);
            return <span key={i} style={{ display: 'inline-block', fontFamily: sans, fontSize: 230, fontWeight: 900, letterSpacing: -6, color: C.text, transform: `translateY(${(1 - k) * -200}px) scale(${sx},${sy})`, transformOrigin: 'bottom' }}>{ch}</span>;
          })}
        </div>
        {fr >= hit ? <div style={{ position: 'absolute', left: '50%', bottom: -14, height: 18, borderRadius: 9, background: GRAD, width: `${100 * stick(fr, hit, { damping: 18 })}%`, transform: 'translateX(-50%)', boxShadow: '0 0 60px rgba(255,94,138,0.55)' }} /> : null}
      </div>
      {card > 0 ? (
        <div style={{ position: 'absolute', inset: 0, opacity: card, transform: `translateY(${(1 - card) * -40}px)` }}>
          {fr >= hit + 6 ? (
            <div style={{ position: 'absolute', left: 0, right: 0, top: interpolate(up, [0, 1], [580, 270]), textAlign: 'center', opacity: ramp(fr, hit + 6, hit + 18), fontFamily: sans, fontSize: interpolate(up, [0, 1], [64, 54]), fontWeight: 800, color: C.text }}>
              Preflight checks for <span style={GRAD_TEXT}>Alexa+ add-ons</span>
            </div>
          ) : null}
          <Pop at={mcp} x={960} y={470}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 26, padding: '22px 34px', borderRadius: 26, background: 'rgba(142,162,255,0.12)', border: `2px solid ${C.blue}` }}>
              <Icon name="server" size={56} color={C.blue} />
              <div>
                <div style={{ fontFamily: sans, fontSize: 40, fontWeight: 800, color: C.text, whiteSpace: 'nowrap' }}>An Alexa+ add-on is an MCP server you host</div>
                <div style={{ fontFamily: sans, fontSize: 28, fontWeight: 600, color: C.muted, marginTop: 6, whiteSpace: 'nowrap', opacity: ramp(fr, tools, tools + 10) }}>a small web service that gives the assistant tools, like “add to cart”</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                  <Chip tint={C.blue} style={{ fontSize: 20 }}>MCP 2025-11-25</Chip>
                  <Chip tint={C.blue} style={{ fontSize: 20 }}>Streamable HTTP</Chip>
                  {fr >= yours ? <Chip tint={C.blue} solid style={{ fontFamily: sans, fontWeight: 800, fontSize: 20 }}>the part you write</Chip> : null}
                </div>
              </div>
            </div>
          </Pop>
        </div>
      ) : null}
      {fr >= enter - 2 ? (
        <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - win) * 700}px)`, opacity: Math.min(1, win * 2) }}>
          <div style={{ position: 'absolute', left: CON.x, top: CON.y, width: CON.w, height: CON.h + 46, borderRadius: 18, overflow: 'hidden', background: '#171717', border: '1px solid rgba(255,255,255,0.22)', boxShadow: '0 60px 160px rgba(0,0,0,0.6), 0 0 120px rgba(255,94,138,0.22)' }}>
            <div style={{ height: 46, display: 'flex', alignItems: 'center', gap: 9, padding: '0 18px', background: 'linear-gradient(180deg, #1b2236, #121829)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['#ff5f57', '#febc2e', '#28c840'].map((col) => <span key={col} style={{ width: 13, height: 13, borderRadius: 7, background: col }} />)}
              <div style={{ marginLeft: 18, flex: 1, height: 30, borderRadius: 15, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', padding: '0 16px', fontFamily: mono, fontSize: 17, color: '#c9d1d9', whiteSpace: 'nowrap' }}>
                localhost:5180 · Hearsay’s console, the MCP client
              </div>
            </div>
            <Rec clip={CLIPS.console} t={t} view={view} vw={CON.w} vh={CON.h}>
              <Mark at={enter + 14} x={700} y={384} w={1010} h={48} color={C.blue} out={con(CLIPS.console.result)} />
              <Mark at={con(CLIPS.console.run) - 4} x={2950} y={150} w={180} h={74} out={con(CLIPS.console.result)} />
              <Mark at={mis} x={1600} y={1044} w={330} h={38} out={con(CLIPS.console.top) - 4} />
              <Mark at={checks} x={2050} y={1044} w={1050} h={38} color={C.red} out={con(CLIPS.console.top) - 4} />
              <Mark at={fails} x={700} y={420} w={320} h={56} color={C.red} />
            </Rec>
          </div>
          <RecLabel tint={C.text} style={{ left: CON.x, top: CON.y - 40 }}>real run · real time · the flawed demo build</RecLabel>
        </div>
      ) : null}
      <Pop at={checks} x={1715} y={560}><Chip tint={C.amber} style={{ fontFamily: sans, fontWeight: 800, fontSize: 28, padding: '10px 22px' }}>checks every reply</Chip></Pop>
      <Pop at={fails} x={1715} y={650} rot={-3}><Chip tint={C.red} solid style={{ fontFamily: sans, fontWeight: 800, fontSize: 28, padding: '10px 22px' }}>✗ fails the build</Chip></Pop>
    </div>
  );
}
