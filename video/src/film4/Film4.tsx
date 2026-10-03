/**
 * Film v4, the infomercial cut. One world, one camera, one narrator. Every product scene is a
 * real recording (docs/09 §Proof of function); captions follow the spoken words.
 */
import type { ReactNode } from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { f, FILM4_FRAMES, PIECES, SCENES, sceneStart } from './plan';
import { ANCHOR, camera, TRAVEL } from './world';
import type { Cam } from './world';
import { C, GooDefs, GRAD, mono, sans, SceneClock } from './kit';
import { Intro, Prob } from './Open';
import { How, Rules } from './How';
import { After, Ci, Red } from './Demo';
import { agentFinePrint, Cheat, More, Proof, proofFinePrint } from './More';
import { Offer } from './Offer';
import { Captions } from './Captions';
import { Sound } from './Sound';

const VIEWS: Record<string, () => ReactNode> = {
  prob: Prob, intro: Intro, how: How, rules: Rules, red: Red, after: After, ci: Ci, more: More, cheat: Cheat, proof: Proof, offer: Offer,
};

/** Three soft lights per scene, OpenAI-style mesh gradients: r,g,b of each. */
const PALETTE: Record<string, [string, string, string]> = {
  intro: ['255,178,63', '255,94,138', '139,107,255'],
  prob: ['255,94,91', '255,138,61', '214,51,132'],
  how: ['59,130,246', '139,92,246', '6,182,212'],
  rules: ['255,178,63', '139,107,255', '59,130,246'],
  red: ['229,72,77', '124,58,237', '30,64,175'],
  after: ['34,197,94', '20,184,166', '59,130,246'],
  ci: ['59,130,246', '20,184,166', '139,92,246'],
  more: ['255,94,138', '255,178,63', '139,107,255'],
  cheat: ['229,72,77', '139,92,246', '255,94,138'],
  proof: ['59,130,246', '6,182,212', '255,178,63'],
  offer: ['20,184,166', '255,178,63', '255,94,138'],
};
const SPOTS: Array<[number, number, number]> = [[-780, -430, 1050], [800, 340, 1100], [120, 640, 900]];
/** Quieter light behind the real recordings, so the text stays the brightest thing. */
const DIM = new Set(['red', 'after', 'ci', 'more', 'cheat']);

const CHAPTER: Record<string, string> = {
  intro: '01 · WHAT IT IS', prob: '02 · THE PROBLEM', how: '03 · HOW IT WORKS', rules: '04 · THE RULES', red: '05 · A REAL RUN',
  after: '05 · A REAL RUN', ci: '06 · IN CI', more: '07 · CODING AGENTS', cheat: '07 · CODING AGENTS', proof: '08 · MEASURED', offer: '09 · TRY IT',
};

const FINE: Record<string, string> = {
  intro: 'Unofficial. Not affiliated with or endorsed by Amazon. Narration is AI-generated. The test case is suites/household-orders.yaml, as committed.',
  prob: 'Unofficial. Not affiliated with or endorsed by Amazon. Each situation is a check Hearsay runs.',
  how: 'In its default mode Hearsay replays speech recognition and the model from your test cases: no microphone, no model, no network.',
  rules: 'From Amazon’s published Alexa+ MCP Toolkit quickstart and functional requirements. Hearsay checks them early; it doesn’t certify anything.',
  red: 'Real run, one take, real time: video/tapes/orders-flawed-4k.tape at main 9b4acdd. Reproduce it: README → Demo.',
  after: 'Real run, real time: video/tapes/orders-fixed-4k.tape, same commit, same suite. Reply quoted from that run.',
  ci: 'Real CI: pull request #27, runs 36779993236 (red) and 36780493038 (green), read from GitHub with gh: video/tapes/ci-pr27-4k.tape.',
  more: agentFinePrint,
  cheat: 'Real run, real time: video/tapes/cheat-4k.tape.',
  proof: proofFinePrint,
  offer: 'Real run, one take: video/tapes/clone-4k.tape. Clone and install at 2×, the run at real time. Unofficial; not affiliated with or endorsed by Amazon. Narration is AI-generated.',
};

const PRE = Math.ceil(TRAVEL / 2) + 6;

function Station({ name, cam, children }: { name: string; cam: Cam; children: ReactNode }) {
  const [ax, ay] = ANCHOR[name]!;
  const dx = (ax - cam.x) * cam.z;
  const dy = (ay - cam.y) * cam.z;
  if (Math.abs(dx) > 2300 || Math.abs(dy) > 1400) return null;
  const blur = Math.min(5, cam.speed * 0.045);
  return (
    <AbsoluteFill style={{ transform: `translate(${dx}px, ${dy}px) scale(${cam.z})`, transformOrigin: '960px 540px', filter: blur > 0.4 ? `blur(${blur.toFixed(2)}px)` : undefined }}>
      {children}
    </AbsoluteFill>
  );
}

function Backdrop({ cam }: { cam: Cam }) {
  const frame = useCurrentFrame();
  const t = frame / 60;
  const minor = 80 * cam.z;
  const major = 400 * cam.z;
  const ox = 960 - cam.x * cam.z;
  const oy = 540 - cam.y * cam.z;
  return (
    <AbsoluteFill style={{ background: '#05060C' }}>
      {SCENES.map((s) => {
        const [ax, ay] = ANCHOR[s.name]!;
        const cx = 960 + (ax - cam.x) * cam.z;
        const cy = 540 + (ay - cam.y) * cam.z;
        if (Math.abs(cx - 960) > 3000 || Math.abs(cy - 540) > 2200) return null;
        const k = DIM.has(s.name) ? 0.34 : 0.55;
        return SPOTS.map(([dx, dy, r], i) => {
          const x = cx + (dx + 90 * Math.sin(t / 3.1 + i * 2.1)) * cam.z;
          const y = cy + (dy + 70 * Math.cos(t / 2.7 + i * 1.3)) * cam.z;
          const rr = r * cam.z;
          return <div key={`${s.name}${i}`} style={{ position: 'absolute', left: x - rr, top: y - rr, width: rr * 2, height: rr * 2, borderRadius: '50%', mixBlendMode: 'screen', background: `radial-gradient(circle, rgba(${PALETTE[s.name]![i]},${k}) 0%, rgba(${PALETTE[s.name]![i]},${k * 0.35}) 38%, transparent 68%)` }} />;
        });
      })}
      <AbsoluteFill style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.22) 1.6px, transparent 2px), linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
        backgroundSize: `${major}px ${major}px, ${minor}px ${minor}px, ${minor}px ${minor}px`,
        backgroundPosition: `${ox - major / 2}px ${oy - major / 2}px, ${ox}px ${oy}px, ${ox}px ${oy}px`,
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 85%)',
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 85%)',
      }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5))' }} />
    </AbsoluteFill>
  );
}

const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>").replace('%2523', '%23')}")`;

/** Film grain, chapter label, progress and registration marks: the technical layer on top. */
function Hud() {
  const frame = useCurrentFrame();
  const s = [...SCENES].reverse().find((x) => frame >= f(sceneStart(x.name)) - 10) ?? SCENES[0]!;
  const n = (frame * 7919) % 240;
  const mark = (x: number, y: number) => (
    <div key={`${x}${y}`} style={{ position: 'absolute', left: x - 12, top: y - 12, width: 24, height: 24 }}>
      <div style={{ position: 'absolute', left: 11.5, top: 0, width: 1, height: 24, background: 'rgba(255,255,255,0.28)' }} />
      <div style={{ position: 'absolute', top: 11.5, left: 0, height: 1, width: 24, background: 'rgba(255,255,255,0.28)' }} />
    </div>
  );
  return (
    <>
      <AbsoluteFill style={{ backgroundImage: GRAIN, backgroundPosition: `${n}px ${(n * 3) % 240}px`, opacity: 0.07, mixBlendMode: 'overlay', pointerEvents: 'none' }} />
      {[mark(34, 34), mark(1886, 34), mark(34, 1046), mark(1886, 1046)]}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
        <div style={{ fontFamily: mono, fontSize: 14, letterSpacing: 3, color: 'rgba(235,240,255,0.55)' }}>{CHAPTER[s.name]}</div>
        <div style={{ width: 150, height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.12)' }}><div style={{ width: `${(100 * frame) / FILM4_FRAMES}%`, height: '100%', borderRadius: 1, background: GRAD }} /></div>
      </div>
    </>
  );
}

function FinePrint() {
  const frame = useCurrentFrame();
  const s = [...SCENES].reverse().find((x) => frame >= f(sceneStart(x.name)) - 10);
  if (!s) return null;
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, bottom: 14, textAlign: 'center', fontFamily: sans, fontSize: 15, lineHeight: 1.35, color: 'rgba(200,210,230,0.62)' }}>{FINE[s.name]}</div>
  );
}

export function Film4() {
  const frame = useCurrentFrame();
  const cam = camera(frame);
  return (
    <AbsoluteFill style={{ background: C.ink, fontFamily: sans }}>
      <GooDefs />
      <Backdrop cam={cam} />
      {SCENES.map((s) => {
        const from = f(sceneStart(s.name)) - PRE;
        const View = VIEWS[s.name]!;
        return (
          <Sequence key={s.name} from={from} durationInFrames={f(s.seconds) + PRE * 2} name={s.name}>
            <SceneClock.Provider value={PRE}>
              <Station name={s.name} cam={cam}><View /></Station>
            </SceneClock.Provider>
          </Sequence>
        );
      })}
      <Hud />
      <Captions />
      <FinePrint />
      {PIECES.map((p, i) => (
        <Sequence key={i} from={f(p.audioAt)} durationInFrames={f(p.trimTo - p.trimFrom) + 2} name={`voice ${p.line}`}>
          <Audio src={staticFile(`voice/v4-${p.line}.mp3`)} volume={(fr) => Math.min(1, (fr + 1) / 3, (f(p.trimTo - p.trimFrom) - fr) / 4)} />
        </Sequence>
      ))}
      <Sound />
    </AbsoluteFill>
  );
}
