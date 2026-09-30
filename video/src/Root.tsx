import { Composition } from 'remotion';
import { Film } from './film/Film';
import { Film3 } from './film3/Film3';
import { FILM3_FRAMES } from './film3/plan';
import { FILM_FRAMES } from './film/timeline';
import { Mishearing } from './motion/Mishearing';
import { Skit, SKIT_FRAMES } from './motion/Skit';
import { HeroReport } from './product/HeroReport';
import { StyleFrame } from './scenes/StyleFrame';
import { FPS, H, W } from './theme';

export function Root() {
  return (
    <>
      <Composition id="StyleFrame" component={StyleFrame} durationInFrames={180} fps={FPS} width={W} height={H} />
      <Composition id="Film3" component={Film3} durationInFrames={FILM3_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="Film" component={Film} durationInFrames={FILM_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="Skit" component={Skit} durationInFrames={SKIT_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="Mishearing" component={Mishearing} durationInFrames={480} fps={FPS} width={W} height={H} />
      <Composition id="HeroReport" component={HeroReport} durationInFrames={180} fps={FPS} width={W} height={H} />
      <Composition id="StyleFramePill" component={StyleFrame} defaultProps={{ pill: true }} durationInFrames={180} fps={FPS} width={W} height={H} />
    </>
  );
}
