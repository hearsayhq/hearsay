/** A macOS-style window around the real console markup (packages/web), in the console's dark theme. */
import type { CSSProperties, ReactNode } from 'react';
import '../../../packages/web/src/styles.css';

// The console's own dark tokens (packages/web/src/styles.css, prefers-color-scheme: dark).
const dark = {
  '--bg': '#151514', '--panel': '#1e1e1c', '--ink': '#ecebe6', '--muted': '#9a9993', '--line': '#33332f',
  '--accent': '#7c9bff', '--accent-ink': '#0f1424', '--err': '#ff8a80', '--err-bg': '#3a1f1d', '--warn': '#f2c14e',
  '--warn-bg': '#362b12', '--info': '#9cc3ec', '--info-bg': '#1b2a3a', '--ok': '#7fd4a0', '--tool': '#7c9bff',
  colorScheme: 'dark',
} as CSSProperties;

export function AppWindow({ width, height, title, children, style }: { width: number; height: number; title: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        width, height, borderRadius: 14, overflow: 'hidden', position: 'relative',
        background: '#151514', border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 60px 140px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.6), 0 0 120px rgba(255,170,43,0.10)',
        ...style,
      }}
    >
      <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', background: '#1b1b19', borderBottom: '1px solid #2a2a27' }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((col) => <span key={col} style={{ width: 13, height: 13, borderRadius: 7, background: col }} />)}
        <div style={{ margin: '0 auto', fontSize: 14, color: '#9a9993', background: '#232321', borderRadius: 7, padding: '4px 60px', fontFamily: 'system-ui' }}>{title}</div>
      </div>
      <div style={{ ...dark, background: 'var(--bg)', color: 'var(--ink)', font: '15px/1.5 system-ui, -apple-system, sans-serif', height: height - 44, overflow: 'hidden', position: 'relative' }}>{children}</div>
    </div>
  );
}
