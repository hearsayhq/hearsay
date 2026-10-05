/**
 * Film v5, the use-case cut. One world, one camera, one narrator who never says the wake word;
 * the customer and the add-on speak with Amazon Polly. Every product scene is a real recording or
 * a real page (docs/09 §Proof of function); captions follow every voice.
 */
import type { ReactNode } from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { f, FILM5_FRAMES, PIECES, POLLY, SCENES, sceneStart } from './plan';
import { ANCHOR, camera, TRAVEL } from './world';
import type { Cam } from './world';
import { C, GooDefs, GRAD, mono, sans, SceneClock } from '../film4/kit';
import { Case, What } from './Case';
import { How, Rules } from './How';
import { After, Ci, Red } from './Demo';
import { agentFinePrint, Agent, Cheat } from './More';
import { Offer } from './Offer';
import { Captions } from './Captions';
import { Sound } from './Sound';

const VIEWS: Record<string, () => ReactNode> = {
  case: Case, what: What, how: How, rules: Rules, red: Red, after: After, ci: Ci, agent: Agent, cheat: Cheat, offer: Offer,
};

/** Three soft lights per scene, OpenAI-style mesh gradients: r,g,b of each. */
const PALETTE: Record<string, [string, string, string]> = {
  case: ['255,178,63', '255,94,138', '139,107,255'],
  what: ['255,178,63', '255,94,138', '139,107,255'],
  how: ['59,130,246', '139,92,246', '6,182,212'],
  rules: ['255,178,63', '139,107,255', '59,130,246'],
  red: ['229,72,77', '124,58,237', '30,64,175'],
  after: ['34,197,94', '20,184,166', '59,130,246'],
  ci: ['59,130,246', '20,184,166', '139,92,246'],
  agent: ['255,94,138', '255,178,63', '139,107,255'],
  cheat: ['229,72,77', '139,92,246', '255,94,138'],
  offer: ['20,184,166', '255,178,63', '255,94,138'],
};
const SPOTS: Array<[number, number, number]> = [[-780, -430, 1050], [800, 340, 1100], [120, 640, 900]];
/** Quieter light behind the real recordings, so the text stays the brightest thing. */
const DIM = new Set(['red', 'after', 'ci', 'agent', 'cheat']);

const CHAPTER: Record<string, string> = {
  case: '01 · A USE CASE', what: '02 · WHAT IT IS', how: '03 · HOW IT WORKS', rules: '04 · THE RULES', red: '05 · A REAL RUN',
  after: '05 · A REAL RUN', ci: '06 · ON EVERY CHANGE', agent: '07 · FOR CODING AGENTS', cheat: '07 · FOR CODING AGENTS', offer: '08 · TRY IT',
};

const FINE: Record<string, string> = {
  case: 'Unofficial. Not affiliated with or endorsed by Amazon. Narration is AI-generated; the customer and the add-on speak with Amazon Polly. “Added.” is the flawed demo build’s real reply.',
  what: 'Amazon’s add-on requirements: an MCP server on spec 2025-11-25 or later, over Streamable HTTP. Hearsay is unofficial and certifies nothing.',
  how: 'By default Hearsay replays the words, the mishearings and the tool call from your test: no microphone, no model, no network. Neither the table nor the recordings are Alexa’s own speech recognition.',
  rules: 'From Amazon’s published functional requirements for Alexa+ add-ons. Hearsay checks them early; it doesn’t certify anything.',
  red: 'Real run, one take, real time: video/tapes/orders-flawed-4k.tape at main 9b4acdd. Reproduce it: README → Demo.',
  after: 'Real run, real time: video/tapes/orders-fixed-4k.tape, same commit, same tests. The reply is quoted from that run and spoken by Amazon Polly.',
  ci: 'Pull request #27, a demo change: runs 36779993236 (red) and 36780493038 (green). Pages from github.com, logged out; the log line read with gh: video/tapes/ci-pr27-4k.tape.',
  agent: agentFinePrint,
  cheat: 'Real run, real time: video/tapes/cheat-4k.tape.',
  offer: 'Real run, one take: video/tapes/clone-v5.tape at main 3cc07c5, 5 Oct 2026. Clone and install at 2×, the run at real time. Unofficial; not affiliated with or endorsed by Amazon. Narration is AI-generated.',
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
        <div style={{ width: 150, height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.12)' }}><div style={{ width: `${(100 * frame) / FILM5_FRAMES}%`, height: '100%', borderRadius: 1, background: GRAD }} /></div>
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

export function Film5() {
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
          <Audio src={staticFile(`voice/v5-${p.line}.mp3`)} volume={(fr) => Math.min(1, (fr + 1) / 3, (f(p.trimTo - p.trimFrom) - fr) / 4)} />
        </Sequence>
      ))}
      {POLLY.map((p) => (
        <Sequence key={p.id} from={f(sceneStart(p.scene) + p.at)} durationInFrames={f(p.seconds) + 6} name={`polly ${p.id}`}>
          <Audio src={staticFile(`voice/${p.id}.mp3`)} volume={0.95} />
        </Sequence>
      ))}
      <Sound />
    </AbsoluteFill>
  );
}
