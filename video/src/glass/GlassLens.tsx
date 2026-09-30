/**
 * The same liquid glass as LiquidGlass, for content inside a 3D-transformed window, where
 * backdrop filters come out scrambled. The lens renders a second copy of the content, clipped to
 * the pane and refracted by an ordinary filter in the content's own coordinates, plus the lit rim.
 */
import { useMemo, type ReactNode } from 'react';
import { displacementMap } from './LiquidGlass';

interface Props {
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
  bevel?: number;
  strength?: number;
  dispersion?: number;
  zoom?: number;
  /** Size of the content being refracted, in its own coordinates. */
  canvas: { width: number; height: number };
  /** Opaque background behind the copy, so the unbent content does not show through. */
  background: string;
  children: ReactNode;
}

let nextId = 0;

export function GlassLens({ x, y, width, height, radius = height / 2, bevel = 24, strength = 14, dispersion = 0.05, zoom = 0.06, canvas, background, children }: Props) {
  const id = useMemo(() => `lens-${nextId++}`, []);
  const map = useMemo(() => displacementMap(Math.round(width), Math.round(height), radius, bevel, strength, zoom), [width, height, radius, bevel, strength, zoom]);
  const channel = (scale: number, keep: string, name: string) => (
    <>
      <feDisplacementMap in="SourceGraphic" in2="map" scale={scale} xChannelSelector="R" yChannelSelector="G" result={`${name}d`} />
      <feColorMatrix in={`${name}d`} type="matrix" values={keep} result={name} />
    </>
  );
  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <filter id={id} x={x} y={y} width={width} height={height} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feImage href={map.url} x={x} y={y} width={width} height={height} preserveAspectRatio="none" result="map" />
          {channel(map.scale * (1 + dispersion), '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', 'r')}
          {channel(map.scale, '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0', 'g')}
          {channel(map.scale * (1 - dispersion), '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0', 'b')}
          <feBlend in="r" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="b" mode="screen" />
        </filter>
      </svg>
      <div style={{ position: 'absolute', left: x, top: y, width, height, borderRadius: radius, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: -x, top: -y, width: canvas.width, height: canvas.height, background, filter: `url(#${id})` }}>{children}</div>
      </div>
      <div
        style={{
          position: 'absolute', left: x, top: y, width, height, borderRadius: radius, pointerEvents: 'none',
          boxShadow: 'inset 1.5px 1.5px 0 rgba(255,255,255,0.75), inset -1px -1px 0 rgba(120,130,150,0.45), inset 0 0 0 1px rgba(255,255,255,0.10), 0 18px 50px rgba(0,0,0,0.45)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02) 45%, rgba(255,255,255,0) 60%)',
        }}
      />
    </>
  );
}
