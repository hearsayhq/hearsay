/**
 * The proof, all real recordings: the flawed grocery add-on under Hearsay (uncut, red), the fixed
 * build (green), and pull request #27's hearsay / voice check, red on a change and green after the
 * fix, read from GitHub. The camera only frames; nothing in a recording is cut or sped up.
 */
import type { ReactNode } from 'react';
import { CLIPS, CLIP_AT, cue, sceneFrames } from './plan';
import { C, Chip, Icon, Mark, mono, Pop, ramp, Rec, RecLabel, sans, sec, Stamp, Starburst, stick, TermWindow, track, useF } from './kit';
import type { View } from './kit';

const W = (scene: string) => (line: string, i: number) => cue(scene, line, i);
/** The terminal window: content viewport and where it sits. */
const WIN = { x: 160, y: 70, w: 1600, h: 860 };

function Flip({ deg, children }: { deg: number; children: ReactNode }) {
  return <div style={{ position: 'absolute', inset: 0, perspective: 2400 }}><div style={{ position: 'absolute', inset: 0, transform: `rotateY(${deg}deg)`, backfaceVisibility: 'hidden' }}>{children}</div></div>;
}

/** A note stuck onto the scene, explaining what the recording shows. */
export function Note({ at, x, y, tint = C.amber, rot = -2, width, children, out }: { at: number; x: number; y: number; tint?: string; rot?: number; width?: number; children: ReactNode; out?: number }) {
  return (
    <Pop at={at} x={x} y={y} rot={rot} out={out}>
      <div style={{ width, fontFamily: sans, fontSize: 30, fontWeight: 700, color: C.text, padding: '16px 24px', borderRadius: 18, background: 'rgba(10,13,26,0.84)', border: `2px solid ${tint}`, boxShadow: `0 24px 60px rgba(0,0,0,0.55), 0 0 40px ${tint}33`, lineHeight: 1.3 }}>{children}</div>
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
    [w('red2', 0) + 14, { x: 0, y: 96, w: 3840 }],
    [w('red2', 0) + 44, { x: 900, y: 1470 - h(1900) / 2, w: 1900 }],
    [w('red2', 4), { x: 900, y: 1470 - h(1900) / 2, w: 1900 }],
    [w('red2', 8) + 10, { x: 1760, y: 1470 - h(1900) / 2, w: 1900 }],
    [w('red2', 9) - 10, { x: 1760, y: 1470 - h(1900) / 2, w: 1900 }],
    [w('red2', 9) + 22, { x: 900, y: 2160 - h(1900), w: 1900 }],
    [w('red2', 13), { x: 900, y: 2160 - h(1900), w: 1900 }],
    [w('red2', 16) - 14, { x: 1300, y: 2160 - h(1900), w: 1900 }],
    [w('red2', 16) + 10, { x: 0, y: 2160 - h(1500), w: 1500 }],
    [w('red2', 20) - 6, { x: 0, y: 2160 - h(1500), w: 1500 }],
    [w('red2', 20) + 22, { x: 0, y: 96, w: 3840 }],
  ];
  const view = track(fr, keys);
  const flip = ramp(fr, D - 14, D, 0, 90, (x) => x * x);
  const enter = stick(fr, -10, { damping: 16, stiffness: 150 });
  return (
    <Flip deg={flip}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${0.82 + 0.18 * enter})`, opacity: Math.min(1, enter * 2) }}>
        <RecLabel tint={C.red} style={{ left: WIN.x, top: 22 }}>real run · uncut · one take</RecLabel>
        <RecLabel style={{ right: 1920 - WIN.x - WIN.w, top: 22 }}>main @ 9b4acdd · recorded {`3 Oct 2026`}</RecLabel>
        <TermWindow title="hearsay — bash — the flawed build" w={WIN.w} h={WIN.h} glow={C.red} style={{ left: WIN.x, top: WIN.y }}>
          <Rec clip={CLIPS.flawed} t={t} view={view} vw={WIN.w} vh={WIN.h}>
            <Mark at={sec(0.9)} x={246} y={78} w={267} h={30} color={C.blue} out={out - 10} />
            <Mark at={sec(1.25)} x={74} y={112} w={550} h={28} color={C.blue} out={out - 10} />
            <Mark at={sec(3.7)} x={1984} y={149} w={343} h={30} color={C.red} out={out - 10} />
            <Mark at={w('red2', 0) + 30} x={985} y={1455} w={2790} h={32} />
            <Mark at={w('red2', 9) + 16} x={985} y={1807} w={2120} h={32} color={C.red} />
            <Mark at={w('red2', 16)} x={70} y={1949} w={1040} h={26} color={C.red} />
            <Mark at={w('red2', 18)} x={70} y={2020} w={118} h={26} color={C.red} />
          </Rec>
        </TermWindow>
        <Note at={sec(1.0)} x={1380} y={520} tint={C.blue} out={out - 12}>the commit, the date: <span style={{ color: C.blue }}>this take</span></Note>
        <Note at={sec(3.75)} x={1300} y={680} tint={C.red} rot={2} out={out - 12}>HEARSAY_FIXED=0 · the flawed build</Note>
        <Note at={w('red2', 0) + 34} x={1380} y={830} rot={-2} out={w('red2', 9) + 8}>said <b style={{ color: C.amber }}>fifteen</b> → heard <b style={{ color: '#FFB4B2' }}>fifty</b> → taken</Note>
        <Note at={w('red2', 9) + 20} x={1380} y={330} tint={C.red} rot={2} out={w('red2', 16) - 4}>said <b>no</b> → order placed anyway</Note>
        <Stamp at={w('red2', 18) - 2} x={1500} y={760} text="Exit 1" size={84} rot={-8} />
        <Stamp at={w('red2', 20) + 8} x={900} y={420} text="Build fails" size={120} rot={-6} sub="20 errors · 8 of 10 runs failed" />
      </div>
    </Flip>
  );
}

export function After() {
  const fr = useF();
  const w = W('after');
  const t = fr / 60 - CLIP_AT.fixed;
  const out = sec(CLIP_AT.fixed + CLIPS.fixed.output);
  const h = (vw: number) => (vw * WIN.h) / WIN.w;
  const view = track(fr, [
    [0, { x: 20, y: 20, w: 1900 }],
    [sec(1.4), { x: 20, y: 20, w: 1900 }],
    [sec(2.1), { x: 500, y: 20, w: 1900 }],
    [sec(3.4), { x: 500, y: 20, w: 1900 }],
    [sec(4.0), { x: 20, y: 20, w: 1900 }],
    [out, { x: 20, y: 20, w: 1900 }],
    [out + 18, { x: 0, y: 200, w: 2700 }],
    [w('after3', 0) + 4, { x: 0, y: 200, w: 2700 }],
    [w('after3', 0) + 30, { x: 0, y: 960 - h(1800) / 2, w: 1800 }],
  ]);
  const flip = fr < 0 ? -90 : ramp(fr, 0, 16, -90, 0);
  return (
    <Flip deg={flip}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <Pop at={8} x={520} y={40} rot={-2}><Chip tint={C.red} solid style={{ fontFamily: sans, fontWeight: 800, fontSize: 22 }}>BEFORE · 20 errors · exit 1</Chip></Pop>
        <Pop at={w('after3', 0)} x={1400} y={40} rot={2}><Chip tint={C.green} solid style={{ fontFamily: sans, fontWeight: 800, fontSize: 22 }}>AFTER · 0 errors · exit 0</Chip></Pop>
        <TermWindow title="hearsay — bash — the fixed build, same suite" w={WIN.w} h={WIN.h} glow={C.green} style={{ left: WIN.x, top: WIN.y }}>
          <Rec clip={CLIPS.fixed} t={t} view={view} vw={WIN.w} vh={WIN.h}>
            <Mark at={sec(2.2)} x={1984} y={78} w={330} h={30} color={C.green} out={out - 10} />
            <Mark at={w('after3', 0) + 4} x={70} y={925} w={1000} h={26} color={C.green} />
            <Mark at={w('after3', 1) + 6} x={70} y={997} w={118} h={26} color={C.green} />
          </Rec>
        </TermWindow>
        <Note at={sec(2.3)} x={1300} y={560} tint={C.green} rot={2} out={w('after2', 1) - 6}>HEARSAY_FIXED=1 · the fixed build</Note>
        <Note at={w('after2', 1)} x={1330} y={610} tint={C.green} rot={-1.5} width={700} out={out - 4}>
          <div style={{ fontFamily: mono, fontSize: 18, color: C.amber, marginBottom: 8 }}>HEARD “ADD FIFTY DOLLARS OF FRUIT”</div>
          “That would go over the total budget you gave me. You can add less, or give me a bigger budget.”
          <div style={{ fontFamily: mono, fontSize: 16, color: C.green, marginTop: 10 }}>REAL REPLY · FIXED BUILD</div>
          <div style={{ fontFamily: sans, fontSize: 22, color: C.muted, marginTop: 10 }}>flawed build: <span style={{ textDecoration: 'line-through', color: '#FFB4B2' }}>“Added.”</span></div>
        </Note>
        <Stamp at={w('after3', 0) + 2} x={1360} y={760} text="Zero errors" color={C.green} size={90} rot={-6} />
      </div>
    </Flip>
  );
}

const CIW = { x: 600, y: 70, w: 1250, h: 860 };

export function Ci() {
  const fr = useF();
  const w = W('ci');
  const t = fr / 60 - CLIP_AT.ci;
  const at = (s: number) => sec(CLIP_AT.ci + s);
  const view = track(fr, [
    [at(14.85) + 6, { x: 30, y: 30, w: 2100 }],
    [at(14.85) + 34, { x: 30, y: 2160 - (2100 * CIW.h) / CIW.w, w: 2100 }],
  ]);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <TermWindow title="hearsay — gh — pull request #27" w={CIW.w} h={CIW.h} style={{ left: CIW.x, top: CIW.y }}>
        <Rec clip={CLIPS.ci} t={t} view={view} vw={CIW.w} vh={CIW.h}>
          <Mark at={at(5.7)} x={72} y={261} w={1440} h={38} color={C.red} />
          <Mark at={at(6.0)} x={119} y={750} w={1325} h={38} color={C.red} />
          <Mark at={at(6.3)} x={72} y={1017} w={850} h={32} color={C.red} />
          <Mark at={at(9.95)} x={75} y={1328} w={3250} h={39} />
          <Mark at={at(14.95)} x={75} y={1551} w={1440} h={38} color={C.green} />
          <Mark at={at(15.2)} x={75} y={1727} w={735} h={36} color={C.green} />
          <Mark at={at(15.5)} x={73} y={1863} w={1995} h={37} color={C.green} />
        </Rec>
      </TermWindow>
      <RecLabel style={{ left: CIW.x, top: 22 }}>real CI · read from GitHub with gh</RecLabel>
      <Note at={w('ci1', 1)} x={330} y={150} rot={-3} width={500} tint={C.blue}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: mono, fontSize: 18, color: C.blue, marginBottom: 8 }}><Icon name="pr" size={22} color={C.blue} /> PULL REQUEST #27 · f7725be</div>
        Check the budget for counted items only
      </Note>
      <Note at={at(5.75)} x={330} y={355} rot={2} width={480} tint={C.red}>
        <span style={{ color: C.red }}>✗</span> hearsay / voice
        <div style={{ fontFamily: mono, fontSize: 18, color: C.muted, marginTop: 6 }}>Process completed with exit code 1</div>
      </Note>
      <Note at={at(9.95)} x={330} y={530} rot={-2} width={500}>
        <div style={{ fontFamily: mono, fontSize: 20, color: C.amber, marginBottom: 6 }}>consent.misheard_amount</div>
        heard “add <b style={{ color: '#FFB4B2' }}>fifty</b> dollars of fruit”, and took it
      </Note>
      <Note at={w('ci3', 0) - 2} x={320} y={725} rot={1.5} width={560} tint={C.blue}>
        <div style={{ fontFamily: mono, fontSize: 18, color: C.blue, marginBottom: 8 }}>57e680a · the fix</div>
        <div style={{ fontFamily: mono, fontSize: 15.5, lineHeight: 1.5, whiteSpace: 'nowrap' }}>
          <div style={{ color: '#ff8a80' }}>- ...(quantity !== undefined ? {'{ amountMinor }'} : {'{}'})</div>
          <div style={{ color: C.green }}>+ ...(amountMinor !== undefined ? {'{ amountMinor }'} : {'{}'})</div>
        </div>
      </Note>
      <Note at={at(14.95)} x={330} y={900} rot={-2} width={420} tint={C.green}><span style={{ color: C.green }}>✓</span> hearsay / voice</Note>
      <Seal at={at(15.4)} x={1520} y={700} />
    </div>
  );
}

/** "As seen in CI": an infomercial seal around the real check's name. */
export function Seal({ at, x, y, size = 300 }: { at: number; x: number; y: number; size?: number }) {
  const fr = useF();
  if (fr < at) return null;
  const k = stick(fr, at, { damping: 10, stiffness: 220 });
  return (
    <div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, transform: `scale(${k}) rotate(${(1 - k) * 40 - 10}deg)`, zIndex: 40 }}>
      <Starburst size={size} points={28} inner={0.88} fill={C.green} spin={fr * 0.3}>
        <div style={{ fontFamily: sans, fontSize: size * 0.09, fontWeight: 900, color: C.ink, letterSpacing: 2 }}>AS SEEN IN</div>
        <div style={{ fontFamily: sans, fontSize: size * 0.22, fontWeight: 900, color: C.ink, lineHeight: 0.95 }}>CI</div>
        <div style={{ fontFamily: mono, fontSize: size * 0.055, color: C.ink, marginTop: 4 }}>hearsay / voice ✓</div>
      </Starburst>
    </div>
  );
}
