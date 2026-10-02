/**
 * Film v4, the infomercial cut. One world, one camera, one narrator. Every product scene is a
 * real recording (docs/09 §Proof of function); captions follow the spoken words.
 */
import type { ReactNode } from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { f, PIECES, SCENES, sceneStart } from './plan';
import { ANCHOR, camera, TRAVEL } from './world';
import type { Cam } from './world';
import { C, GooDefs, sans, SceneClock } from './kit';
import { Cold, Intro, Prob } from './Open';
import { How, Rules } from './How';
import { After, Ci, Red } from './Demo';
import { agentFinePrint, Cheat, More, Proof, proofFinePrint } from './More';
import { Offer } from './Offer';
import { Captions } from './Captions';
import { Sound } from './Sound';

const VIEWS: Record<string, () => ReactNode> = {
  cold: Cold, prob: Prob, intro: Intro, how: How, rules: Rules, red: Red, after: After, ci: Ci, more: More, cheat: Cheat, proof: Proof, offer: Offer,
};

const MOOD: Record<string, string> = {
  cold: '255,94,91', prob: '255,94,91', intro: '255,170,43', how: '142,162,255', rules: '255,170,43', red: '255,94,91',
  after: '61,220,151', ci: '142,162,255', more: '255,170,43', cheat: '255,94,91', proof: '255,170,43', offer: '61,220,151',
};

const FINE: Record<string, string> = {
  cold: 'Unofficial. Not affiliated with or endorsed by Amazon. Narration is AI-generated. Replies quoted word for word from a real run of suites/household-orders.yaml against the flawed build.',
  prob: 'Unofficial. Not affiliated with or endorsed by Amazon.',
  intro: 'Unofficial. Not affiliated with or endorsed by Amazon. The test case is suites/household-orders.yaml, as committed.',
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
  const grid = 56 * cam.z;
  return (
    <AbsoluteFill style={{ background: '#070B16' }}>
      {SCENES.map((s) => {
        const [ax, ay] = ANCHOR[s.name]!;
        const x = 960 + (ax - cam.x) * cam.z;
        const y = 540 + (ay - cam.y) * cam.z;
        if (Math.abs(x - 960) > 2600 || Math.abs(y - 540) > 1800) return null;
        return <div key={s.name} style={{ position: 'absolute', left: x - 1100 * cam.z, top: y - 760 * cam.z, width: 2200 * cam.z, height: 1520 * cam.z, background: `radial-gradient(closest-side, rgba(${MOOD[s.name]},0.13), rgba(${MOOD[s.name]},0.04) 60%, transparent)` }} />;
      })}
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.10) 1.5px, transparent 1.8px)', backgroundSize: `${grid}px ${grid}px`, backgroundPosition: `${960 - cam.x * cam.z}px ${540 - cam.y * cam.z}px` }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55))' }} />
    </AbsoluteFill>
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
      <Captions />
      <FinePrint />
      {PIECES.map((p, i) => (
        <Sequence key={i} from={f(p.audioAt)} durationInFrames={f(p.trimTo - p.trimFrom) + 2} name={`voice ${p.line}`}>
          <Audio src={staticFile(`voice/v4-${p.line}.mp3`)} trimBefore={f(p.trimFrom)} trimAfter={f(p.trimTo)} />
        </Sequence>
      ))}
      <Sound />
    </AbsoluteFill>
  );
}
