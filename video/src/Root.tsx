import { Composition } from 'remotion';
import { Film } from './film/Film';
import { Film3 } from './film3/Film3';
import { Film4 } from './film4/Film4';
import { Film5 } from './film5/Film5';
import { FILM5_FRAMES } from './film5/plan';
import { Banner, BANNER } from './readme/Banner';
import { How, HOW } from './readme/How';
import { FILM4_FRAMES } from './film4/plan';
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
      <Composition id="Film5" component={Film5} durationInFrames={FILM5_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="Film4" component={Film4} durationInFrames={FILM4_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="Banner" component={Banner} durationInFrames={1} fps={FPS} width={BANNER.width} height={BANNER.height} />
      <Composition id="How" component={How} durationInFrames={1} fps={FPS} width={HOW.width} height={HOW.height} />
      <Composition id="Film3" component={Film3} durationInFrames={FILM3_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="Film" component={Film} durationInFrames={FILM_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="Skit" component={Skit} durationInFrames={SKIT_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="Mishearing" component={Mishearing} durationInFrames={480} fps={FPS} width={W} height={H} />
      <Composition id="HeroReport" component={HeroReport} durationInFrames={180} fps={FPS} width={W} height={H} />
      <Composition id="StyleFramePill" component={StyleFrame} defaultProps={{ pill: true }} durationInFrames={180} fps={FPS} width={W} height={H} />
    </>
  );
}
