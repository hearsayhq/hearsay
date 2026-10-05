/**
 * The proof, all real: the flawed grocery add-on under Hearsay (uncut, red) with what each finding
 * means in plain words; the fixed build (green) and its real reply, spoken by Amazon Polly; and pull
 * request #27 on github.com, logged out: the change red, the failing step, the failing log line
 * (read with gh, since GitHub shows logs only after a sign-in), and the fix green.
 */
import type { ReactNode } from 'react';
import { Img, staticFile } from 'remotion';
import { CLIPS, CLIP_AT, cue, PAGES, pollyAt, POLLY, sceneFrames } from './plan';
import { C, Chip, Icon, Mark, mono, Pop, ramp, Rec, RecLabel, sans, sec, Stamp, stick, TermWindow, track, useF } from '../film4/kit';
import type { View } from '../film4/kit';
import { Waves } from './Case';

const W = (scene: string) => (line: string, i: number) => cue(scene, line, i);
/** The terminal window: content viewport and where it sits. */
const WIN = { x: 160, y: 70, w: 1600, h: 860 };

function Flip({ deg, children }: { deg: number; children: ReactNode }) {
  return <div style={{ position: 'absolute', inset: 0, perspective: 2400 }}><div style={{ position: 'absolute', inset: 0, transform: `rotateY(${deg}deg)`, backfaceVisibility: 'hidden' }}>{children}</div></div>;
}

/** A note stuck onto the scene, saying in plain words what the recording shows. */
export function Note({ at, x, y, tint = C.amber, rot = -2, width, children, out }: { at: number; x: number; y: number; tint?: string; rot?: number; width?: number; children: ReactNode; out?: number }) {
  return (
    <Pop at={at} x={x} y={y} rot={rot} out={out}>
      <div style={{ width, fontFamily: sans, fontSize: 30, fontWeight: 700, color: C.text, padding: '16px 24px', borderRadius: 18, background: 'rgba(10,13,26,0.88)', border: `2px solid ${tint}`, boxShadow: `0 24px 60px rgba(0,0,0,0.55), 0 0 40px ${tint}33`, lineHeight: 1.3 }}>{children}</div>
    </Pop>
  );
}

/** A dark veil over a recording, so a card on top can be read. */
function Veil({ from, to }: { from: number; to: number }) {
  const fr = useF();
  const o = Math.min(ramp(fr, from, from + 16), 1 - ramp(fr, to, to + 16)) * 0.78;
  return o > 0 ? <div style={{ position: 'absolute', left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h + 44, borderRadius: 18, background: `rgba(5,7,14,${o})` }} /> : null;
}

/** What a run found, in plain words: one card, rows added as they are said, held until it goes. */
function Findings({ rows, from, to, title, tint }: { rows: Array<{ at: number; text: string }>; from: number; to: number; title: string; tint: string }) {
  const fr = useF();
  if (fr < from || fr > to + 16) return null;
  const k = stick(fr, from, { damping: 16, stiffness: 140 });
  const o = 1 - ramp(fr, to, to + 14);
  return (
    <div style={{ position: 'absolute', left: 960, top: 470, transform: `translate(-50%,-50%) scale(${0.9 + 0.1 * k})`, opacity: Math.min(1, k * 2) * o, width: 1180, padding: '30px 40px', borderRadius: 26, background: 'rgba(10,13,26,0.94)', border: `2px solid ${tint}`, boxShadow: `0 40px 100px rgba(0,0,0,0.6), 0 0 60px ${tint}33` }}>
      <div style={{ fontFamily: mono, fontSize: 20, letterSpacing: 3, color: tint, marginBottom: 18 }}>{title}</div>
      {rows.map((r) => fr >= r.at ? (
        <div key={r.text} style={{ display: 'flex', gap: 18, alignItems: 'baseline', marginBottom: 14, opacity: ramp(fr, r.at, r.at + 10), transform: `translateX(${(1 - stick(fr, r.at)) * -30}px)` }}>
          <span style={{ fontFamily: sans, fontSize: 36, fontWeight: 900, color: tint }}>✗</span>
          <span style={{ fontFamily: sans, fontSize: 38, fontWeight: 700, color: C.text, lineHeight: 1.25 }}>{r.text}</span>
        </div>
      ) : null)}
    </div>
  );
}

export function Red() {
  const fr = useF();
  const w = W('red');
  const D = sceneFrames('red');
  const t = fr / 60 - CLIP_AT.flawed;
  const out = sec(CLIP_AT.flawed + CLIPS.flawed.output);
  const h = (vw: number) => (vw * WIN.h) / WIN.w;
  const cardFrom = w('red', 0) - 8;
  const cardTo = w('red', 15) - 6;
  // Calm camera: the prompt while it is typed, the whole output when it lands, the totals at the end.
  const view = track(fr, [
    [sec(0.6), { x: 0, y: 0, w: 2600 }],
    [out - 10, { x: 0, y: 0, w: 2600 }],
    [out + 30, { x: 0, y: 0, w: 3840 }],
    [cardTo, { x: 0, y: 0, w: 3840 }],
    [cardTo + 50, { x: 0, y: 2160 - h(2400), w: 2400 }],
  ]);
  const flip = ramp(fr, D - 14, D, 0, 90, (x) => x * x);
  const enter = stick(fr, -10, { damping: 16, stiffness: 150 });
  return (
    <Flip deg={flip}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${0.82 + 0.18 * enter})`, opacity: Math.min(1, enter * 2) }}>
        <RecLabel tint={C.red} style={{ left: WIN.x, top: 22 }}>real run · uncut · one take</RecLabel>
        <RecLabel style={{ right: 1920 - WIN.x - WIN.w, top: 22 }}>main @ 9b4acdd · recorded 3 Oct 2026</RecLabel>
        <TermWindow title="hearsay — the demo grocery add-on, flawed on purpose" w={WIN.w} h={WIN.h} glow={C.red} style={{ left: WIN.x, top: WIN.y }}>
          <Rec clip={CLIPS.flawed} t={t} view={view} vw={WIN.w} vh={WIN.h}>
            <Mark at={cardTo + 50} x={70} y={1949} w={1040} h={26} color={C.red} />
          </Rec>
        </TermWindow>
        <Note at={sec(3.0)} x={1320} y={700} tint={C.red} rot={2} out={out - 6}>our demo add-on, with these flaws on purpose</Note>
        <Veil from={cardFrom} to={cardTo} />
        <Findings from={cardFrom} to={cardTo} tint={C.red} title="WHAT HEARSAY FOUND · 3 OF 20 ERRORS" rows={[
          { at: w('red', 0), text: 'Heard fifty. Added fifty. Never said the amount back.' },
          { at: w('red', 8), text: 'The customer said no. The order was placed anyway.' },
          { at: w('red', 11), text: 'Asked “Are you sure?” without saying what or how much.' },
        ]} />
        <Stamp at={w('red', 17) + 8} x={1200} y={420} text="Build fails" size={110} rot={-6} sub="20 errors" />
      </div>
    </Flip>
  );
}

/** A reply the add-on speaks: what was heard, the words, its bars while it plays. */
function Reply({ id, heard, from, to }: { id: string; heard: string; from: number; to: number }) {
  const p = POLLY.find((q) => q.id === id)!;
  const at = pollyAt(id);
  return (
    <Note at={from} x={1250} y={560} tint={C.green} rot={-1.5} width={820} out={to}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: mono, fontSize: 18, color: C.amber, marginBottom: 10 }}>
        HEARD “{heard}” · THE ADD-ON SAYS <Waves from={at} len={Math.round(p.seconds * 60)} color={C.green} size={0.7} />
      </div>
      “{p.text}”
      <div style={{ fontFamily: mono, fontSize: 16, color: C.green, marginTop: 10 }}>THE FIXED ADD-ON’S REAL REPLY · VOICE: AMAZON POLLY</div>
    </Note>
  );
}

export function After() {
  const fr = useF();
  const w = W('after');
  const t = fr / 60 - CLIP_AT.fixed;
  const out = sec(CLIP_AT.fixed + CLIPS.fixed.output);
  const zero = w('fix2', 0);
  const h = (vw: number) => (vw * WIN.h) / WIN.w;
  const view = track(fr, [
    [sec(0.4), { x: 0, y: 0, w: 2600 }],
    [zero - 10, { x: 0, y: 0, w: 2600 }],
    [zero + 30, { x: 0, y: 960 - h(2400) / 2, w: 2400 }],
  ]);
  const flip = fr < 0 ? -90 : ramp(fr, 0, 16, -90, 0);
  const second = w('fix1b', 0) - 6;
  return (
    <Flip deg={flip}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <Pop at={8} x={520} y={40} rot={-2}><Chip tint={C.red} solid style={{ fontFamily: sans, fontWeight: 800, fontSize: 22 }}>BEFORE · 20 errors</Chip></Pop>
        <Pop at={zero} x={1400} y={40} rot={2}><Chip tint={C.green} solid style={{ fontFamily: sans, fontWeight: 800, fontSize: 22 }}>AFTER · 0 errors</Chip></Pop>
        <TermWindow title="hearsay — the fixed add-on, same tests" w={WIN.w} h={WIN.h} glow={C.green} style={{ left: WIN.x, top: WIN.y }}>
          <Rec clip={CLIPS.fixed} t={t} view={view} vw={WIN.w} vh={WIN.h}>
            <Mark at={zero + 30} x={70} y={925} w={1000} h={26} color={C.green} />
          </Rec>
        </TermWindow>
        <Note at={sec(1.0)} x={1300} y={560} tint={C.green} rot={2} out={pollyAt('p5-fixed-clean') - 14}>the fixed add-on, same tests</Note>
        <Reply id="p5-fixed-clean" heard="ADD FIFTEEN DOLLARS OF FRUIT" from={pollyAt('p5-fixed-clean') - 6} to={second - 10} />
        <Reply id="p5-fixed" heard="ADD FIFTY DOLLARS OF FRUIT" from={second} to={zero - 6} />
        <Stamp at={zero + 2} x={1360} y={760} text="Zero errors" color={C.green} size={90} rot={-6} />
      </div>
    </Flip>
  );
}

/** A page from github.com, as captured, in a browser window that shows its address. */
const PAGE = { w: 3200, h: 1800 };
function Browser({ url, src, view, x, y, w, h, children }: { url: string; src: string; view: View; x: number; y: number; w: number; h: number; children?: ReactNode }) {
  const k = w / view.w;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h + 52, borderRadius: 18, overflow: 'hidden', background: '#0d1117', border: '1px solid rgba(255,255,255,0.22)', boxShadow: '0 60px 160px rgba(0,0,0,0.6), 0 0 120px rgba(59,130,246,0.25)' }}>
      <div style={{ height: 52, display: 'flex', alignItems: 'center', gap: 9, padding: '0 18px', background: 'linear-gradient(180deg, #1b2236, #121829)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((col) => <span key={col} style={{ width: 13, height: 13, borderRadius: 7, background: col }} />)}
        <div style={{ marginLeft: 18, flex: 1, height: 32, borderRadius: 16, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', fontFamily: mono, fontSize: 17, color: '#c9d1d9', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          <Icon name="lock" size={16} color="#8b949e" /> {url}
        </div>
      </div>
      <div style={{ position: 'relative', width: w, height: h, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: PAGE.w, height: PAGE.h, transformOrigin: '0 0', transform: `translate(${-view.x * k}px, ${-view.y * k}px) scale(${k})` }}>
          <Img src={staticFile(src)} style={{ position: 'absolute', left: 0, top: 0, width: PAGE.w, height: PAGE.h }} />
          {children}
        </div>
      </div>
    </div>
  );
}

const BW = { x: 160, y: 96, w: 1600, h: 800 };

export function Ci() {
  const fr = useF();
  const w = W('ci');
  const toRed = w('ci2', 0) - 16;
  const toGreen = w('ci3', 0) - 16;
  const page = fr < toRed ? 'commits' : fr < toGreen ? 'redJob' : 'greenJob';
  const swap = (at: number) => ramp(fr, at - 8, at + 4);
  const enter = Math.min(1, ...[toRed, toGreen].map((a) => (fr >= a - 8 && fr < a + 12 ? Math.abs(1 - 2 * swap(a)) : 1)));
  const commitsView = track(fr, [
    [w('ci1', 3), { x: 0, y: 0, w: 3200 }],
    [w('ci1', 7), { x: 300, y: 330, w: 2600 }],
  ]);
  const jobView: View = { x: 560, y: 720, w: 2100 };
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <RecLabel style={{ left: BW.x, top: 54 }}>github.com · public · logged out · captured 5 Oct 2026</RecLabel>
      <RecLabel tint={C.blue} style={{ right: 1920 - BW.x - BW.w, top: 54 }}>pull request #27 · a demo change</RecLabel>
      <div style={{ position: 'absolute', inset: 0, opacity: enter }}>
        {page === 'commits' ? (
          <Browser url={PAGES.commits.url} src={PAGES.commits.src} view={commitsView} {...BW}>
            <Mark at={w('ci1', 8) + 6} x={467} y={800} w={2346} h={130} color={C.red} />
          </Browser>
        ) : page === 'redJob' ? (
          <Browser url={PAGES.redJob.url} src={PAGES.redJob.src} view={jobView} {...BW}>
            <Mark at={toRed + 16} x={770} y={1440} w={1100} h={58} color={C.red} />
          </Browser>
        ) : (
          <Browser url={PAGES.greenJob.url} src={PAGES.greenJob.src} view={{ x: 560, y: 560, w: 2100 }} {...BW}>
            <Mark at={toGreen + 18} x={770} y={1240} w={1100} h={58} color={C.green} />
          </Browser>
        )}
      </div>
      <Note at={w('ci1', 8) + 10} x={1440} y={760} rot={-2} width={560} tint={C.red} out={toRed - 16}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: mono, fontSize: 18, color: C.red, marginBottom: 6 }}><Icon name="pr" size={22} color={C.red} /> THE CHANGE · f7725be</div>
        let fifty dollars of fruit slip past the budget
      </Note>
      <Note at={toRed + 18} x={1440} y={760} rot={2} width={540} tint={C.red} out={toGreen - 16}>
        <span style={{ color: C.red }}>✗</span> the Hearsay check failed: fifty taken without the customer hearing it
      </Note>
      <Note at={toGreen + 20} x={1440} y={760} rot={-2} width={520} tint={C.green}>
        <div style={{ fontFamily: mono, fontSize: 18, color: C.green, marginBottom: 6 }}>THE FIX · 57e680a</div>
        <span style={{ color: C.green }}>✓</span> every step passes
      </Note>
    </div>
  );
}
