import { Composition } from 'remotion';
import { HeroReport } from './product/HeroReport';
import { StyleFrame } from './scenes/StyleFrame';
import { FPS, H, W } from './theme';

export function Root() {
  return (
    <>
      <Composition id="StyleFrame" component={StyleFrame} durationInFrames={180} fps={FPS} width={W} height={H} />
      <Composition id="HeroReport" component={HeroReport} durationInFrames={180} fps={FPS} width={W} height={H} />
      <Composition id="StyleFramePill" component={StyleFrame} defaultProps={{ pill: true }} durationInFrames={180} fps={FPS} width={W} height={H} />
    </>
  );
}
