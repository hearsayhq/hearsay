/**
 * 06–07 · The proof, all real. The flawed grocery add-on under Hearsay (one take), its findings
 * as a stream, and the build failing in full red; the fixed build (same tests) and its two real
 * replies, spoken by Amazon Polly, with the budget that makes it refuse; and pull request #27 on
 * github.com, logged out: the change red, the fix green.
 */
import type { CSSProperties, ReactNode } from 'react';
import { Img, staticFile } from 'remotion';
import { CLIPS, CLIP_AT, PAGES, POLLY, pollyAt, sceneFrames } from '../film5/plan';
import { Rec, track } from '../film4/kit';
import type { View } from '../film4/kit';
import { display, mono, P, QIN, QIO, serif } from './design';
import { cueOf, Hi, Label, Morph, Odometer, Place, ramp, Rise, sec, useF, useInk, Window, Words } from './kit';
import { PICK_RECT } from './Scan';
import { pollyLoud, useAbs } from './clock';

/** Error check ids from the flawed run's real output, for the stream behind the findings. */
const ERRORS = [
  'case.expect', 'consent.verbal_token', 'mandate.expiry', 'mandate.schema_ignoring_caller', 'mandate.version_race',
  'consent.states_details', 'consent.misheard_amount', 'consent.decline_holds', 'mandate.injection', 'consent.over_confirmation',
];

function Stream({ from, to, x, top, height }: { from: number; to: number; x: number; top: number; height: number }) {
  const fr = useF();
  const ink = useInk();
  if (fr < from - 10 || fr > to + 20) return null;
  const o = Math.min(ramp(fr, from - 10, from + 20), 1 - ramp(fr, to, to + 20));
  const y = ((fr - from) * 2.2) % (ERRORS.length * 54);
  return (
    <div style={{ position: 'absolute', left: x, top, height, width: 520, overflow: 'hidden', opacity: o * 0.5, maskImage: 'linear-gradient(transparent, black 20%, black 80%, transparent)' }}>
      <div style={{ transform: `translateY(${-y}px)` }}>
        {[...ERRORS, ...ERRORS, ...ERRORS].map((e, i) => (
          <div key={i} style={{ height: 54, display: 'flex', alignItems: 'center', gap: 14, fontFamily: mono, fontSize: 20, color: ink.muted }}>
            <span style={{ color: P.red }}>✗</span>{e}<span style={{ marginLeft: 'auto', fontSize: 14, letterSpacing: '0.1em' }}>ERROR</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A finding, in plain words, with whose rule it is. */
function Finding({ at, text, src, i }: { at: number; text: string; src: string; i: number }) {
  const fr = useF();
  const ink = useInk();
  const k = ramp(fr, at - 4, at + 22, 0, 1, QIO);
  if (k <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 0, top: i * 168, width: 560, transform: `translateX(${(1 - k) * 120}px)`, opacity: k, background: ink.raise, borderLeft: `6px solid ${P.red}`, padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 14, letterSpacing: '0.12em', color: ink.muted }}><span style={{ color: P.red }}>✗ ERROR</span><span>{src}</span></div>
      <div style={{ fontFamily: display, fontSize: 32, fontWeight: 650, letterSpacing: '-0.02em', lineHeight: 1.12, color: ink.fg, marginTop: 10 }}>{text}</div>
    </div>
  );
}

/** A full-bleed verdict: the colour takes the frame, the words land in it. */
export function Flood({ at, color, title, sub, until }: { at: number; color: string; title: ReactNode; sub?: string; until?: number }) {
  const fr = useF();
  const k = ramp(fr, at - 2, at + 14, 0, 1, QIO);
  if (k <= 0) return null;
  const o = until === undefined ? 1 : 1 - ramp(fr, until, until + 12, 0, 1, QIN);
  return (
    <div style={{ position: 'absolute', inset: 0, background: color, clipPath: `inset(${(1 - k) * 50}% 0 ${(1 - k) * 50}% 0)`, opacity: o, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', zIndex: 5 }}>
      <div style={{ fontFamily: display, fontWeight: 900, fontSize: 230, letterSpacing: '-0.055em', lineHeight: 0.9, transform: `scale(${1.15 - 0.15 * ramp(fr, at, at + 30)})` }}>{title}</div>
      {sub ? <div style={{ fontFamily: mono, fontSize: 28, letterSpacing: '0.14em', marginTop: 34, textTransform: 'uppercase', opacity: ramp(fr, at + 10, at + 24) }}>{sub}</div> : null}
    </div>
  );
}

const WIN = { x: 96, y: 120, w: 1120, h: 740 };

export function Red() {
  const fr = useF();
  const ink = useInk();
  const w = cueOf('red');
  const t = fr / 60 - CLIP_AT.flawed;
  const out = sec(CLIP_AT.flawed + CLIPS.flawed.output);
  const h = (vw: number) => (vw * WIN.h) / WIN.w;
  const found = w('red', 0) - 8;
  const twenty = w('red', 15);
  const fails = w('red', 17);
  const view = track(fr, [
    [sec(0.4), { x: 0, y: 0, w: 2400 }],
    [out - 10, { x: 0, y: 0, w: 2400 }],
    [out + 30, { x: 0, y: 0, w: 3840 }],
    [twenty - 40, { x: 0, y: 0, w: 3840 }],
    [twenty, { x: 0, y: 2160 - h(2000), w: 2000 }],
  ]);
  const k = ramp(fr, 16, 44);
  return (
    <>
      {/* In: one red square of the scan opens into this run's window. */}
      <Morph from={PICK_RECT} to={{ x: WIN.x, y: WIN.y, w: WIN.w, h: WIN.h + 38 }} a={0} b={26} fill={P.red} fadeAt={30} z={0} />
      <Window x={WIN.x} y={WIN.y} w={WIN.w} h={WIN.h} k={k} ry={6} rx={2} title="hearsay — the demo grocery add-on, flawed on purpose" tag="REAL RUN · ONE TAKE" tagColor={P.red}>
        <Rec clip={CLIPS.flawed} t={t} view={view} vw={WIN.w} vh={WIN.h}>
          <Hi at={twenty} x={70} y={1949} w={1040} h={26} color={P.red} />
        </Rec>
      </Window>
      <div style={{ position: 'absolute', left: 1290, top: 140, width: 570 }}>
        <div style={{ opacity: 1 - ramp(fr, found - 20, found) }}>
          <Label><Rise at={w('run', 2)}>a real run against</Rise></Label>
          <div style={{ fontFamily: display, fontSize: 60, fontWeight: 750, letterSpacing: '-0.035em', lineHeight: 1.02, color: ink.fg, marginTop: 14 }}>
            <Words parts={[['our', w('run', 5)], ['demo', w('run', 6)], ['grocery', w('run', 7)], ['add-on', w('run', 8)]]} />
          </div>
          <div style={{ fontFamily: serif, fontSize: 64, color: P.orange, lineHeight: 1.05, marginTop: 6 }}>
            <Words parts={[['flaws', w('run', 12)], ['on', w('run', 13)], ['purpose', w('run', 14)]]} gap="0.2em" />
          </div>
          <Place x={0} y={250} at={w('run', 17)}>
            <Label>the customer allowed</Label>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 10 }}>
              <span style={{ fontFamily: display, fontSize: 120, fontWeight: 800, letterSpacing: '-0.05em', color: ink.fg }}>$50</span>
              <span style={{ fontFamily: mono, fontSize: 22, color: ink.muted }}>of groceries today</span>
            </div>
          </Place>
        </div>
        <Stream from={found} to={twenty} x={0} top={0} height={700} />
        <div style={{ position: 'absolute', left: 0, top: 30 }}>
          <Finding i={0} at={w('red', 0)} text="Heard fifty. Added fifty. Never said the amount back." src="AMAZON’S RULE" />
          <Finding i={1} at={w('red', 8)} text="The customer said no. The order was placed anyway." src="AMAZON’S RULE" />
          <Finding i={2} at={w('red', 9) + 6} text="Asked “Are you sure?” without saying what or how much." src="AMAZON’S RULE" />
        </div>
      </div>
      <Place x={1290} y={680} at={twenty} dy={0}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, background: ink.bg, padding: '10px 0' }}>
          <Odometer value={20} at={twenty} dur={34} size={200} color={P.red} />
          <span style={{ fontFamily: display, fontSize: 56, fontWeight: 750, color: ink.fg }}>errors</span>
        </div>
      </Place>
      <Flood at={fails} color={P.red} title="BUILD FAILS" sub="20 errors · 9 different checks · exit 1" />
    </>
  );
}

/** A reply the add-on speaks, word by word with its voice, and what it was heard as. */
function Reply({ id, heard, hot, top }: { id: string; heard: ReactNode; hot: number[]; top: number }) {
  const fr = useF();
  const abs = useAbs();
  const ink = useInk();
  const p = POLLY.find((q) => q.id === id)!;
  const at = pollyAt(id);
  const words = p.text.split(' ');
  const step = (p.seconds * 60) / words.length;
  const k = ramp(fr, at - 20, at + 6);
  if (k <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 1080, top, width: 760, opacity: k, transform: `translateY(${(1 - k) * 30}px)` }}>
      <div style={{ fontFamily: mono, fontSize: 18, color: ink.muted, letterSpacing: '0.04em' }}>HEARD {heard}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 18 }}>
        <Label color={P.orange}>the add-on says</Label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 40 }}>
          {Array.from({ length: 36 }, (_, i) => <span key={i} style={{ width: 4, height: Math.max(3, pollyLoud(abs - (35 - i) * 2) * 40), background: P.orange }} />)}
        </div>
      </div>
      <div style={{ fontFamily: display, fontSize: 52, fontWeight: 650, letterSpacing: '-0.03em', lineHeight: 1.12, color: ink.fg, marginTop: 14 }}>
        <Words parts={words.map((x, i) => [i === 0 ? `“${x}` : i === words.length - 1 ? `${x}”` : x, at + Math.round(i * step), hot.includes(i) ? { color: P.orange } : undefined] as [string, number, CSSProperties?])} gap="0.24em" />
      </div>
    </div>
  );
}

/** The cart against the budget: what is in it, what fifty more would do, and the refusal. */
function Budget({ at, refuse }: { at: number; refuse: number }) {
  const fr = useF();
  const ink = useInk();
  const k = ramp(fr, at - 10, at + 20);
  if (k <= 0) return null;
  const W = 640;
  const scale = W / 60;
  const cart = 7.4 * scale * ramp(fr, at, at + 20, 0, 1, QIO);
  const more = 50 * scale * ramp(fr, at + 30, at + 70, 0, 1, QIO);
  const blocked = ramp(fr, refuse, refuse + 16, 0, 1, QIO);
  return (
    <div style={{ position: 'absolute', left: 1080, top: 110, width: 760, opacity: k * (1 - ramp(fr, refuse + 140, refuse + 160)) }}>
      <Label>the cart against the budget</Label>
      <div style={{ position: 'relative', height: 64, marginTop: 22, border: `2px solid ${ink.fg}` }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: cart, background: ink.fg }} />
        <div style={{ position: 'absolute', left: cart, top: 0, bottom: 0, width: more, background: `repeating-linear-gradient(135deg, ${P.red} 0 10px, transparent 10px 20px)`, opacity: 1 - 0.7 * blocked }} />
        <div style={{ position: 'absolute', left: 50 * scale - 2, top: -16, bottom: -16, width: 4, background: P.orange }} />
      </div>
      <div style={{ position: 'relative', height: 40, fontFamily: mono, fontSize: 18, color: ink.muted, marginTop: 10 }}>
        <span style={{ position: 'absolute', left: 0 }}>milk $7.40</span>
        <span style={{ position: 'absolute', left: 50 * scale - 60, color: P.orange }}>budget $50</span>
        <span style={{ position: 'absolute', right: 0, color: P.red, opacity: ramp(fr, at + 60, at + 70) }}>+ $50 → $57.40</span>
      </div>
      <div style={{ fontFamily: serif, fontSize: 64, color: P.orange, marginTop: 4, opacity: blocked }}>so it refuses, and says why</div>
    </div>
  );
}

export function After() {
  const fr = useF();
  const ink = useInk();
  const w = cueOf('after');
  const t = fr / 60 - CLIP_AT.fixed;
  const zero = w('fix2', 0);
  const second = w('fix1b', 0);
  const D = sceneFrames('after');
  // The red of the failed build recedes into a chip: before, 20 errors.
  const rec = ramp(fr, -2, 26, 0, 1, QIO);
  const view = track(fr, [[sec(0.4), { x: 0, y: 0, w: 2600 }], [sec(6), { x: 0, y: 0, w: 2600 }]]);
  return (
    <>
      <div style={{ position: 'absolute', left: 96 * rec, top: 112 * rec, width: 1920 - (1920 - 300) * rec, height: 1080 - (1080 - 46) * rec, background: P.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono, fontSize: 18, fontWeight: 600, letterSpacing: '0.14em', color: '#fff', zIndex: 4 }}>
        {rec > 0.85 ? 'BEFORE · 20 ERRORS' : ''}
      </div>
      <Place x={420} y={112} at={zero} dx={-20} dy={0}>
        <div style={{ height: 46, width: 300, background: P.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono, fontSize: 18, fontWeight: 600, letterSpacing: '0.14em', color: '#fff' }}>AFTER · 0 ERRORS</div>
      </Place>
      <Window x={96} y={190} w={920} h={620} k={ramp(fr, 10, 46)} ry={5} rx={2} title="hearsay — the fixed add-on, same tests" tag="REAL RUN · REAL TIME" tagColor={P.greenBright}>
        <Rec clip={CLIPS.fixed} t={t} view={view} vw={920} vh={620}>
          <Hi at={zero} x={70} y={925} w={1000} h={26} color={P.greenBright} />
        </Rec>
      </Window>
      <div style={{ position: 'absolute', left: 1080, top: 150, opacity: 1 - ramp(fr, pollyAt('p5-fixed-clean') - 24, pollyAt('p5-fixed-clean') - 8) }}>
        <Label><Rise at={w('fix1', 1)}>the fixed add-on · same tests</Rise></Label>
        <div style={{ fontFamily: display, fontSize: 64, fontWeight: 750, letterSpacing: '-0.035em', lineHeight: 1.04, color: ink.fg, marginTop: 14, width: 760 }}>
          <Words parts={[['When', w('fix1', 5)], ['it', w('fix1', 6)], ['adds,', w('fix1', 7)], ['it', w('fix1', 8)], ['says', w('fix1', 9)], ['the', w('fix1', 10)], ['amount', w('fix1', 11), { fontFamily: serif, fontWeight: 400, color: P.orange, fontSize: 74 }], ['back.', w('fix1', 12), { fontFamily: serif, fontWeight: 400, color: P.orange, fontSize: 74 }]]} />
        </div>
      </div>
      {fr < second - 6 ? <Reply id="p5-fixed-clean" heard={<>“add fifteen dollars of fruit”</>} hot={[1, 2, 7, 8, 9, 10, 11, 12]} top={420} /> : null}
      <Budget at={w('fix1b', 5)} refuse={w('fix1b', 15)} />
      {fr >= pollyAt('p5-fixed') - 24 ? <Reply id="p5-fixed" heard={<>“add <span style={{ color: P.orange }}>fifty</span> dollars of fruit”</>} hot={[3, 4, 5, 6, 7]} top={420} /> : null}
      <Flood at={zero} color={P.green} title={<span style={{ display: 'flex', alignItems: 'baseline', gap: 40 }}><Odometer value={0} from={20} at={zero - 4} dur={30} size={300} color="#fff" weight={900} /><span>errors</span></span>} sub="the build passes · warnings never fail it" until={D + 40} />
    </>
  );
}

/** A page from github.com, as captured (3200×1800), in a window that shows its address. */
const PAGE = { w: 3200, h: 1800 };
function Browser({ url, src, view, w, h, children }: { url: string; src: string; view: View; w: number; h: number; children?: ReactNode }) {
  const k = w / view.w;
  return (
    <div style={{ position: 'relative', width: w, height: h + 44, background: '#0d1117', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', background: '#141413' }}>
        <span style={{ display: 'flex', gap: 7 }}>{[0, 1, 2].map((i) => <span key={i} style={{ width: 11, height: 11, borderRadius: 6, background: 'rgba(255,255,255,0.16)' }} />)}</span>
        <span style={{ fontFamily: mono, fontSize: 15, color: 'rgba(236,232,223,0.7)', whiteSpace: 'nowrap', overflow: 'hidden' }}>{url}</span>
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

/** The pull request's window: the next page's window grows out of it. */
export const CI_WIN = { x: 760, y: 200, w: 1060, h: 644 };

export function Ci() {
  const fr = useF();
  const ink = useInk();
  const w = cueOf('ci');
  const toRed = w('ci2', 0) - 14;
  const toGreen = w('ci3', 0) - 14;
  const page = fr < toRed ? 'commits' : fr < toGreen ? 'redJob' : 'greenJob';
  // The window turns over to the next page.
  const turn = (a: number) => (fr >= a - 9 && fr < a + 9 ? Math.abs(fr - a) / 9 : 1);
  const flip = Math.min(turn(toRed), turn(toGreen));
  const commitsView = track(fr, [[w('ci1', 0), { x: 300, y: 385, w: 2500 }], [w('ci1', 4), { x: 340, y: 385, w: 2450 }]]);
  const BW = 1060;
  const BH = 600;
  const k = ramp(fr, 14, 40);
  const node = (y: number, at: number, ok: boolean, sha: string, text: string) => {
    const kk = ramp(fr, at - 6, at + 16, 0, 1, QIO);
    return (
      <div style={{ position: 'absolute', left: 0, top: y, display: 'flex', gap: 26, alignItems: 'center', opacity: kk, transform: `translateX(${(1 - kk) * -30}px)` }}>
        <div style={{ width: 56, height: 56, borderRadius: 28, background: ok ? P.greenBright : P.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono, fontSize: 30, fontWeight: 600, color: '#fff', transform: `scale(${0.6 + 0.4 * kk})` }}>{ok ? '✓' : '✗'}</div>
        <div>
          <div style={{ fontFamily: mono, fontSize: 16, letterSpacing: '0.1em', color: ink.muted }}>{sha}</div>
          <div style={{ fontFamily: display, fontSize: 38, fontWeight: 700, letterSpacing: '-0.025em', color: ink.fg, marginTop: 4, width: 520, lineHeight: 1.08 }}>{text}</div>
        </div>
      </div>
    );
  };
  return (
    <>
      {/* In: the green of "zero errors" shrinks into the window of the pull request. */}
      <Morph from={{ x: 0, y: 0, w: 1920, h: 1080 }} to={CI_WIN} a={0} b={26} fill={P.green} fadeAt={28} z={0} />
      <div style={{ position: 'absolute', left: 96, top: 128 }}>
        <Label>github.com · pull request #27 · a demo change</Label>
        <div style={{ fontFamily: display, fontSize: 64, fontWeight: 800, letterSpacing: '-0.04em', color: ink.fg, marginTop: 12 }}>
          <Words parts={[['On', w('ci1', 0)], ['GitHub,', w('ci1', 1)], ['one', w('ci1', 2), { fontFamily: serif, fontWeight: 400, color: P.orange }], ['change.', w('ci1', 3), { fontFamily: serif, fontWeight: 400, color: P.orange }]]} />
        </div>
      </div>
      <div style={{ position: 'absolute', left: 124, top: 330, width: 4, height: 420 * ramp(fr, 10, 60, 0, 1, QIO), background: ink.hair }} />
      <div style={{ position: 'absolute', left: 96, top: 330 }}>
        {node(0, w('ci1', 2), false, 'f7725be · the change', 'skips the budget for dollar amounts')}
        {node(170, w('ci2', 1), false, 'Hearsay · check', 'failed: fifty taken without the customer hearing it')}
        {node(340, w('ci3', 1), true, '57e680a · the fix', 'every step passes')}
      </div>
      <div style={{ position: 'absolute', left: 760, top: 200, transform: `perspective(2600px) rotateY(${(-7 * k) + (1 - flip) * 80}deg) rotateX(${3 * k}deg)`, opacity: k * (0.3 + 0.7 * flip), boxShadow: '0 60px 140px -30px rgba(0,0,0,0.95)' }}>
        {page === 'commits' ? (
          <Browser url={PAGES.commits.url} src={PAGES.commits.src} view={commitsView} w={BW} h={BH}>
            <Hi at={w('ci1', 2) + 6} x={467} y={800} w={2346} h={130} color={P.red} stroke={10} />
          </Browser>
        ) : page === 'redJob' ? (
          <Browser url={PAGES.redJob.url} src={PAGES.redJob.src} view={{ x: 560, y: 600, w: 2100 }} w={BW} h={BH}>
            <Hi at={toRed + 16} x={770} y={1440} w={1100} h={58} color={P.red} stroke={10} />
          </Browser>
        ) : (
          <Browser url={PAGES.greenJob.url} src={PAGES.greenJob.src} view={{ x: 560, y: 560, w: 2100 }} w={BW} h={BH}>
            <Hi at={toGreen + 18} x={770} y={1240} w={1100} h={58} color={P.green} stroke={10} />
          </Browser>
        )}
      </div>
      <Place x={760} y={872} at={w('ci1', 0) + 20}><span style={{ fontFamily: mono, fontSize: 15, color: ink.muted }}>pages from github.com, logged out · captured 5 Oct 2026</span></Place>
    </>
  );
}
