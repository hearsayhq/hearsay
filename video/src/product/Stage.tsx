/** The space the product floats in: deep navy, two soft lights (amber, indigo), a floor grid, grain, vignette. */
import type { ReactNode } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { c } from '../theme';

export function Stage({ children }: { children: ReactNode }) {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: c.ink, overflow: 'hidden' }}>
      <AbsoluteFill style={{ background: `radial-gradient(900px 620px at ${78 + Math.sin(f / 90) * 2}% 8%, rgba(255,170,43,0.22), transparent 70%), radial-gradient(1000px 800px at 8% 100%, rgba(88,96,255,0.20), transparent 70%)` }} />
      <AbsoluteFill style={{ perspective: 900, perspectiveOrigin: '50% 30%' }}>
        <div
          style={{
            position: 'absolute', left: '-50%', right: '-50%', top: '58%', height: '120%',
            transform: 'rotateX(78deg)',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
            backgroundPosition: `0 ${f * 0.6}px`,
            maskImage: 'linear-gradient(to bottom, transparent, black 25%, transparent 80%)',
          }}
        />
      </AbsoluteFill>
      {children}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55))', pointerEvents: 'none' }} />
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.07, mixBlendMode: 'overlay', pointerEvents: 'none' }}>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 60} stitchTiles="stitch" /></filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
}
