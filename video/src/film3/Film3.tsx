/** Script v3 (docs/09): real recordings, voices placed on them, subtitles from second 0. */
import type { ComponentType } from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Stage } from '../product/Stage';
import { How3, Proof, Close3 } from './Ending';
import { Agent3, Green, Red } from './Middle';
import { Cold, Intro3, What3 } from './Opening';
import { ALL_LINES, PLAN, sceneWindow } from './plan';
import { Subtitles3 } from './Subtitles3';

const SCENE: Record<string, ComponentType> = { cold: Cold, intro: Intro3, what: What3, red: Red, agent: Agent3, green: Green, how: How3, proof: Proof, close: Close3 };

function Fade({ children }: { children: React.ReactNode }) {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const o = Math.min(interpolate(f, [0, 10], [0, 1], { extrapolateRight: 'clamp' }), interpolate(f, [durationInFrames - 8, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' }));
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
}

export function Film3() {
  return (
    <Stage>
      {ALL_LINES.map((l) => (
        <Sequence key={l.id} from={l.at} durationInFrames={l.to - l.at + 30}>
          <Audio src={staticFile(l.src)} />
        </Sequence>
      ))}
      {PLAN.map((p) => {
        const w = sceneWindow(p.name);
        const Scene = SCENE[p.name]!;
        return (
          <Sequence key={p.name} from={w.from} durationInFrames={w.frames}>
            <Fade><Scene /></Fade>
          </Sequence>
        );
      })}
      <Subtitles3 />
    </Stage>
  );
}
