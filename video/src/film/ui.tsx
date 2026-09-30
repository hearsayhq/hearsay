/** Small shared pieces of the film: kicker, chip, badge, card, terminal window. */
import type { CSSProperties, ReactNode } from 'react';
import { c, mono, sans } from '../theme';

export const Kicker = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div style={{ fontFamily: sans, fontSize: 22, fontWeight: 600, letterSpacing: 5, color: c.amber, ...style }}>{children}</div>
);

export const Chip = ({ children, tint = c.text, style }: { children: ReactNode; tint?: string; style?: CSSProperties }) => (
  <span style={{ display: 'inline-block', fontFamily: sans, fontSize: 24, fontWeight: 500, color: tint, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '8px 18px', whiteSpace: 'nowrap', ...style }}>{children}</span>
);

export const Sev = ({ level }: { level: 'error' | 'warn' }) => (
  <span style={{ fontFamily: sans, fontSize: 15, fontWeight: 700, letterSpacing: 1, color: level === 'error' ? '#ff8a80' : '#f2c14e', background: level === 'error' ? '#3a1f1d' : '#362b12', borderRadius: 6, padding: '3px 9px' }}>{level === 'error' ? 'ERROR' : 'WARN'}</span>
);

export const Source = ({ kind }: { kind: string }) => (
  <span style={{ fontFamily: sans, fontSize: 16, color: kind === 'amazon-fr' ? c.amber : c.muted, border: `1px solid ${kind === 'amazon-fr' ? 'rgba(255,170,43,0.4)' : 'rgba(255,255,255,0.15)'}`, background: kind === 'amazon-fr' ? c.amberSoft : 'transparent', borderRadius: 6, padding: '3px 9px', whiteSpace: 'nowrap' }}>
    {kind === 'amazon-fr' ? 'Amazon requirement' : kind === 'mcp-spec' ? 'MCP spec' : 'Hearsay'}
  </span>
);

export const Card = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div style={{ background: 'rgba(22,24,32,0.92)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 22, padding: '26px 30px', boxShadow: '0 30px 90px rgba(0,0,0,0.5)', fontFamily: sans, color: c.text, ...style }}>{children}</div>
);

export function Terminal({ title, children, style }: { title: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', background: '#0d1117', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 50px 140px rgba(0,0,0,0.6), 0 0 100px rgba(255,170,43,0.08)', ...style }}>
      <div style={{ height: 42, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', background: '#161b22', borderBottom: '1px solid #21262d' }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((col) => <span key={col} style={{ width: 12, height: 12, borderRadius: 6, background: col }} />)}
        <span style={{ margin: '0 auto', fontFamily: sans, fontSize: 15, color: '#8b949e' }}>{title}</span>
      </div>
      <div style={{ fontFamily: mono, fontSize: 21, lineHeight: 1.55, color: '#c9d1d9', padding: '18px 24px', position: 'relative', overflow: 'hidden' }}>{children}</div>
    </div>
  );
}
