/**
 * Liquid glass, after sterna's optics shader (github.com/HarzerHeribert/sterna, sites/src/optics.js):
 * a rounded pane that bends what lies beneath at its bevel, splits the colour slightly and lights
 * its rim. Here it is a backdrop filter, so it bends live DOM (reports, the console, a terminal)
 * rather than one texture. The displacement map is the pane's signed distance field, drawn once.
 */
import { useMemo, type CSSProperties, type ReactNode } from 'react';

interface Props {
  width: number;
  height: number;
  radius?: number;
  /** Bevel width in px: how far in from the edge the glass bends. */
  bevel?: number;
  /** Strongest shift at the bevel, in px. */
  strength?: number;
  /** Colour split between red and blue, as a fraction of the displacement. */
  dispersion?: number;
  /** Magnification of the flat middle, as a fraction (0.05 = 5 %). */
  zoom?: number;
  style?: CSSProperties;
  children?: ReactNode;
}

let nextId = 0;

/** Returns the map and the displacement scale (px) it is encoded for. */
export function displacementMap(w: number, h: number, r: number, bevel: number, strength: number, zoom: number): { url: string; scale: number } {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const hx = w / 2 - r;
  const hy = h / 2 - r;
  const sd = (x: number, y: number) => {
    const qx = Math.abs(x) - hx;
    const qy = Math.abs(y) - hy;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
  };
  // Displacement in px: the bevel bends inward like sterna's pane (sample from p − n·bend), and
  // the flat middle magnifies a little (sample from p·(1 − zoom)), so the pane reads as a lens.
  const dx = new Float32Array(w * h);
  const dy = new Float32Array(w * h);
  let max = 1;
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const x = i + 0.5 - w / 2;
      const y = j + 0.5 - h / 2;
      const d = sd(x, y);
      if (d >= 0) continue;
      const depth = Math.min(-d / bevel, 1);
      const bend = Math.sin(depth * Math.PI) * strength;
      const nx = sd(x + 0.5, y) - sd(x - 0.5, y);
      const ny = sd(x, y + 0.5) - sd(x, y - 0.5);
      const len = Math.hypot(nx, ny) || 1;
      const k = i + j * w;
      dx[k] = -bend * (nx / len) - zoom * x;
      dy[k] = -bend * (ny / len) - zoom * y;
      max = Math.max(max, Math.abs(dx[k]!), Math.abs(dy[k]!));
    }
  const scale = 2 * max;
  for (let k = 0; k < w * h; k++) {
    img.data[k * 4] = Math.round(255 * (0.5 + dx[k]! / scale));
    img.data[k * 4 + 1] = Math.round(255 * (0.5 + dy[k]! / scale));
    img.data[k * 4 + 2] = 128;
    img.data[k * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return { url: canvas.toDataURL('image/png'), scale };
}

export function LiquidGlass({ width, height, radius = 44, bevel = 40, strength = 22, dispersion = 0.05, zoom = 0.05, style, children }: Props) {
  const id = useMemo(() => `glass-${nextId++}`, []);
  const map = useMemo(() => displacementMap(width, height, radius, bevel, strength, zoom), [width, height, radius, bevel, strength, zoom]);
  const channel = (scale: number, keep: string, name: string) => (
    <>
      <feDisplacementMap in="SourceGraphic" in2="map" scale={scale} xChannelSelector="R" yChannelSelector="G" result={`${name}d`} />
      <feColorMatrix in={`${name}d`} type="matrix" values={keep} result={name} />
    </>
  );
  return (
    <div style={{ position: 'absolute', width, height, borderRadius: radius, ...style }}>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <filter id={id} x="0" y="0" width={width} height={height} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
           <feImage href={map.url} x="0" y="0" width={width} height={height} preserveAspectRatio="none" result="map" />
          {channel(map.scale * (1 + dispersion), '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', 'r')}
          {channel(map.scale, '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0', 'g')}
          {channel(map.scale * (1 - dispersion), '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0', 'b')}
          <feBlend in="r" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="b" mode="screen" />
        </filter>
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: radius,
          backdropFilter: `url(#${id}) saturate(1.15) brightness(1.06)`,
          WebkitBackdropFilter: `url(#${id})`,
          // The lit rim: bright where light falls (top left), dim on the far side; a soft drop shadow.
          boxShadow:
            'inset 1.5px 1.5px 0 rgba(255,255,255,0.75), inset -1px -1px 0 rgba(120,130,150,0.45), inset 0 0 0 1px rgba(255,255,255,0.10), 0 30px 80px rgba(0,0,0,0.35)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02) 45%, rgba(255,255,255,0) 60%)',
        }}
      />
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
    </div>
  );
}
