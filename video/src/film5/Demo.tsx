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

export function Red() {
  const fr = useF();
  const w = W('red');
  const D = sceneFrames('red');
  const t = fr / 60 - CLIP_AT.flawed;
  const out = sec(CLIP_AT.flawed + CLIPS.flawed.output);
  const h = (vw: number) => (vw * WIN.h) / WIN.w;
  const keys: Array<[number, View]> = [
    [sec(0.9), { x: 0, y: 0, w: 3840 }],
    [sec(1.8), { x: 20, y: 20, w: 1900 }],
    [sec(3.0), { x: 20, y: 20, w: 1900 }],
    [sec(3.7), { x: 520, y: 20, w: 1900 }],
    [sec(4.6), { x: 520, y: 20, w: 1900 }],
    [sec(5.3), { x: 20, y: 20, w: 1900 }],
    [out, { x: 20, y: 20, w: 1900 }],
    [out + 22, { x: 0, y: 96, w: 3840 }],
    [w('red', 0) + 4, { x: 0, y: 96, w: 3840 }],
    [w('red', 0) + 34, { x: 900, y: 1470 - h(1900) / 2, w: 1900 }],
    [w('red', 4), { x: 900, y: 1470 - h(1900) / 2, w: 1900 }],
    [w('red', 7) + 10, { x: 1760, y: 1470 - h(1900) / 2, w: 1900 }],
    [w('red', 8) - 10, { x: 1760, y: 1470 - h(1900) / 2, w: 1900 }],
    [w('red', 8) + 22, { x: 900, y: 2160 - h(1900), w: 1900 }],
    [w('red', 12), { x: 900, y: 2160 - h(1900), w: 1900 }],
    [w('red', 15) - 14, { x: 1300, y: 2160 - h(1900), w: 1900 }],
    [w('red', 15) + 10, { x: 0, y: 2160 - h(1500), w: 1500 }],
    [w('red', 17) + 20, { x: 0, y: 2160 - h(1500), w: 1500 }],
    [w('red', 17) + 50, { x: 0, y: 96, w: 3840 }],
  ];
  const view = track(fr, keys);
  const flip = ramp(fr, D - 14, D, 0, 90, (x) => x * x);
  const enter = stick(fr, -10, { damping: 16, stiffness: 150 });
  return (
    <Flip deg={flip}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${0.82 + 0.18 * enter})`, opacity: Math.min(1, enter * 2) }}>
        <RecLabel tint={C.red} style={{ left: WIN.x, top: 22 }}>real run · uncut · one take</RecLabel>
        <RecLabel style={{ right: 1920 - WIN.x - WIN.w, top: 22 }}>main @ 9b4acdd · recorded 3 Oct 2026</RecLabel>
        <TermWindow title="hearsay — the demo grocery add-on, flawed on purpose" w={WIN.w} h={WIN.h} glow={C.red} style={{ left: WIN.x, top: WIN.y }}>
          <Rec clip={CLIPS.flawed} t={t} view={view} vw={WIN.w} vh={WIN.h}>
            <Mark at={sec(3.7)} x={1984} y={149} w={343} h={30} color={C.red} out={out - 10} />
            <Mark at={w('red', 0) + 30} x={985} y={1455} w={2790} h={32} />
            <Mark at={w('red', 8) + 16} x={985} y={1807} w={2120} h={32} color={C.red} />
            <Mark at={w('red', 15)} x={70} y={1949} w={1040} h={26} color={C.red} />
          </Rec>
        </TermWindow>
        <Note at={sec(3.75)} x={1300} y={680} tint={C.red} rot={2} out={out - 12}>the demo add-on, with these flaws on purpose</Note>
        <Note at={w('red', 0) + 34} x={1380} y={830} rot={-2} width={640} out={w('red', 8) + 8}>
          <div style={{ fontFamily: mono, fontSize: 18, color: C.amber, marginBottom: 6 }}>WHAT THIS LINE MEANS</div>
          Heard fifty. Added fifty. Never said the amount back.
        </Note>
        <Note at={w('red', 8) + 20} x={1380} y={330} tint={C.red} rot={2} width={640} out={w('red', 15) - 4}>
          <div style={{ fontFamily: mono, fontSize: 18, color: C.red, marginBottom: 6 }}>WHAT THIS LINE MEANS</div>
          The customer said no. The order was placed anyway.
        </Note>
        <Note at={w('red', 12)} x={1380} y={560} tint={C.red} rot={-1.5} width={640} out={w('red', 15) - 4}>
          And it asked “Are you sure?” without saying what or how much.
        </Note>
        <Stamp at={w('red', 17) + 8} x={900} y={420} text="Build fails" size={120} rot={-6} sub="20 problems found" />
      </div>
    </Flip>
  );
}

export function After() {
  const fr = useF();
  const w = W('after');
  const t = fr / 60 - CLIP_AT.fixed;
  const out = sec(CLIP_AT.fixed + CLIPS.fixed.output);
  const reply = pollyAt('p5-fixed');
  const replyLen = Math.round(POLLY.find((p) => p.id === 'p5-fixed')!.seconds * 60);
  const zero = w('fix2', 0);
  const h = (vw: number) => (vw * WIN.h) / WIN.w;
  const view = track(fr, [
    [0, { x: 20, y: 20, w: 1900 }],
    [sec(1.4), { x: 20, y: 20, w: 1900 }],
    [sec(2.1), { x: 500, y: 20, w: 1900 }],
    [sec(3.4), { x: 500, y: 20, w: 1900 }],
    [sec(4.0), { x: 20, y: 20, w: 1900 }],
    [out, { x: 20, y: 20, w: 1900 }],
    [out + 18, { x: 0, y: 200, w: 2700 }],
    [zero + 4, { x: 0, y: 200, w: 2700 }],
    [zero + 30, { x: 0, y: 960 - h(1800) / 2, w: 1800 }],
  ]);
  const flip = fr < 0 ? -90 : ramp(fr, 0, 16, -90, 0);
  return (
    <Flip deg={flip}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <Pop at={8} x={520} y={40} rot={-2}><Chip tint={C.red} solid style={{ fontFamily: sans, fontWeight: 800, fontSize: 22 }}>BEFORE · 20 problems</Chip></Pop>
        <Pop at={zero} x={1400} y={40} rot={2}><Chip tint={C.green} solid style={{ fontFamily: sans, fontWeight: 800, fontSize: 22 }}>AFTER · 0 errors</Chip></Pop>
        <TermWindow title="hearsay — the fixed add-on, same tests" w={WIN.w} h={WIN.h} glow={C.green} style={{ left: WIN.x, top: WIN.y }}>
          <Rec clip={CLIPS.fixed} t={t} view={view} vw={WIN.w} vh={WIN.h}>
            <Mark at={sec(2.2)} x={1984} y={78} w={330} h={30} color={C.green} out={out - 10} />
            <Mark at={zero + 4} x={70} y={925} w={1000} h={26} color={C.green} />
          </Rec>
        </TermWindow>
        <Note at={sec(1.2)} x={1300} y={560} tint={C.green} rot={2} out={reply - 8}>the fixed add-on, same tests</Note>
        <Note at={reply - 4} x={1280} y={600} tint={C.green} rot={-1.5} width={760} out={zero - 4}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: mono, fontSize: 18, color: C.amber, marginBottom: 10 }}>
            HEARD “ADD FIFTY DOLLARS OF FRUIT” · THE ADD-ON SAYS <Waves from={reply} len={replyLen} color={C.green} size={0.7} />
          </div>
          “That would go over the total budget you gave me. You can add less, or give me a bigger budget.”
          <div style={{ fontFamily: mono, fontSize: 16, color: C.green, marginTop: 10 }}>THE FIXED ADD-ON’S REAL REPLY · VOICE: AMAZON POLLY</div>
          <div style={{ fontFamily: sans, fontSize: 22, color: C.muted, marginTop: 10 }}>the flawed add-on said: <span style={{ textDecoration: 'line-through', color: '#FFB4B2' }}>“Added.”</span></div>
        </Note>
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
  const toRed = w('ci2', 0) - 12;
  const toLog = w('ci2', 3) + 20;
  const toGreen = w('ci3', 0) - 14;
  const page = fr < toRed ? 'commits' : fr < toLog ? 'redJob' : fr < toGreen ? 'log' : 'greenJob';
  const swap = (at: number) => ramp(fr, at - 8, at + 4);
  const enter = Math.min(1, ...[toRed, toLog, toGreen].map((a) => (fr >= a - 8 && fr < a + 12 ? Math.abs(1 - 2 * swap(a)) : 1)));
  const commitsView = track(fr, [
    [w('ci1', 4), { x: 0, y: 0, w: 3200 }],
    [w('ci1', 8), { x: 300, y: 330, w: 2600 }],
  ]);
  const jobView: View = { x: 560, y: 720, w: 2100 };
  const logView = track(fr, [
    [toLog + 90, { x: 0, y: 1328 - 170, w: 1900 }],
    [toLog + 160, { x: 1480, y: 1328 - 170, w: 1900 }],
  ]);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <RecLabel style={{ left: BW.x, top: 30 }}>github.com · public · logged out · captured 5 Oct 2026</RecLabel>
      <RecLabel tint={C.blue} style={{ right: 1920 - BW.x - BW.w, top: 30 }}>pull request #27 · a demo change</RecLabel>
      <div style={{ position: 'absolute', inset: 0, opacity: enter }}>
        {page === 'commits' ? (
          <Browser url={PAGES.commits.url} src={PAGES.commits.src} view={commitsView} {...BW}>
            <Mark at={w('ci1', 8) + 6} x={467} y={800} w={2346} h={130} color={C.red} />
          </Browser>
        ) : page === 'redJob' ? (
          <Browser url={PAGES.redJob.url} src={PAGES.redJob.src} view={jobView} {...BW}>
            <Mark at={toRed + 16} x={770} y={1440} w={1100} h={58} color={C.red} />
          </Browser>
        ) : page === 'log' ? (
          <div style={{ position: 'absolute', left: BW.x, top: 300 }}>
            <TermWindow title="the failing step's log, read with gh (GitHub shows logs only after a sign-in)" w={BW.w} h={300} glow={C.red} style={{ position: 'relative' }}>
              <Rec clip={CLIPS.ci} t={12} view={logView} vw={BW.w} vh={300}>
                <Mark at={toLog + 8} x={75} y={1328} w={3250} h={39} color={C.red} />
              </Rec>
            </TermWindow>
          </div>
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
      <Note at={toRed + 18} x={1440} y={760} rot={2} width={520} tint={C.red} out={toLog - 16}>
        <span style={{ color: C.red }}>✗</span> the Hearsay check failed on the grocery add-on’s tests
      </Note>
      <Note at={toLog + 12} x={960} y={720} rot={-1.5} width={900} tint={C.amber} out={toGreen - 16}>
        heard “add <b style={{ color: '#FFB4B2' }}>fifty</b> dollars of fruit”, and took it without the customer hearing the amount
      </Note>
      <Note at={toGreen + 20} x={1440} y={760} rot={-2} width={520} tint={C.green}>
        <div style={{ fontFamily: mono, fontSize: 18, color: C.green, marginBottom: 6 }}>THE FIX · 57e680a</div>
        <span style={{ color: C.green }}>✓</span> every step passes
      </Note>
    </div>
  );
}
