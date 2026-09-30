/** Frames for real recordings: a terminal window and a browser window around a video, plus labels. */
import type { CSSProperties, ReactNode } from 'react';
import { OffthreadVideo, staticFile } from 'remotion';
import { c, mono, sans } from '../theme';

export function Window({ title, children, style, bar = '#161b22' }: { title: string; children: ReactNode; style?: CSSProperties; bar?: string }) {
  return (
    <div style={{ position: 'absolute', borderRadius: 16, overflow: 'hidden', background: '#0a1020', border: '1px solid rgba(255,255,255,0.14)', boxShadow: '0 50px 140px rgba(0,0,0,0.6), 0 0 100px rgba(255,170,43,0.07)', ...style }}>
      <div style={{ height: 40, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', background: bar, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((col) => <span key={col} style={{ width: 12, height: 12, borderRadius: 6, background: col }} />)}
        <span style={{ margin: '0 auto', fontFamily: sans, fontSize: 15, color: '#8b949e' }}>{title}</span>
      </div>
      <div style={{ position: 'relative', overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

/** A recorded clip, full frame inside its window, or cropped with `crop` (x, y, width in source pixels). */
export function Clip({ src, width, crop }: { src: string; width: number; crop?: { x: number; y: number; w: number; h: number } }) {
  const cw = crop?.w ?? 1920;
  const ch = crop?.h ?? 1080;
  const k = width / cw;
  return (
    <div style={{ width, height: ch * k, overflow: 'hidden', position: 'relative' }}>
      <OffthreadVideo src={staticFile(src)} style={{ position: 'absolute', width: 1920 * k, height: 1080 * k, left: -(crop?.x ?? 0) * k, top: -(crop?.y ?? 0) * k }} />
    </div>
  );
}

export const Tag = ({ children, tint = c.amber, style }: { children: ReactNode; tint?: string; style?: CSSProperties }) => (
  <div style={{ position: 'absolute', fontFamily: mono, fontSize: 18, color: tint, background: 'rgba(5,8,16,0.78)', border: `1px solid ${tint}55`, borderRadius: 8, padding: '6px 12px', whiteSpace: 'nowrap', ...style }}>{children}</div>
);
