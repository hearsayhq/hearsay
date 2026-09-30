/** The whole video: eight scenes cut to one voice track, subtitles from second 0. */
import type { ComponentType } from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Stage } from '../product/Stage';
import { Agent } from './Agent';
import { Close } from './Close';
import { Consent } from './Consent';
import { Experiment } from './Experiment';
import { Intro, What } from './Intro';
import { How } from './How';
import { Problem } from './Problem';
import { Rules } from './Rules';
import { Subtitles } from './Subtitles';
import { LINES, SCENES, window, type SceneName } from './timeline';

const SCENE: Record<SceneName, ComponentType> = { intro: Intro, what: What, how: How, rules: Rules, problem: Problem, consent: Consent, agent: Agent, experiment: Experiment, close: Close };

function Fade({ children }: { children: React.ReactNode }) {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const o = Math.min(interpolate(f, [0, 14], [0, 1], { extrapolateRight: 'clamp' }), interpolate(f, [durationInFrames - 12, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' }));
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
}

export function Film() {
  return (
    <Stage>
      {LINES.map((l) => (
        <Sequence key={l.id} from={l.at} durationInFrames={l.to - l.at + 30}>
          <Audio src={staticFile(l.src)} />
        </Sequence>
      ))}
      {SCENES.map((s) => {
        const w = window(s);
        const Scene = SCENE[s];
        return (
          <Sequence key={s} from={w.from} durationInFrames={w.frames}>
            <Fade><Scene /></Fade>
          </Sequence>
        );
      })}
      <Subtitles />
    </Stage>
  );
}
