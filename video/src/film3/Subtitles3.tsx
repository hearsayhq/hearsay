/** Burned-in subtitles from second 0, coloured by speaker (script v3). */
import { interpolate, useCurrentFrame } from 'remotion';
import { c, sans } from '../theme';
import { ALL_LINES, type Who } from './plan';

const TINT: Record<Who, string> = { narrator: '#F4F6FA', customer: c.amber, addon: '#7FE0C7' };

export function Subtitles3() {
  const f = useCurrentFrame();
  const line = [...ALL_LINES].reverse().find((l) => f >= l.at - 4 && f < l.to + 12);
  if (!line) return null;
  const o = Math.min(interpolate(f, [line.at - 4, line.at + 4], [0, 1]), interpolate(f, [line.to + 4, line.to + 12], [1, 0]));
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 46, display: 'flex', justifyContent: 'center', opacity: o, pointerEvents: 'none' }}>
      <div style={{ maxWidth: 1500, textAlign: 'center', fontFamily: sans, fontSize: 32, fontWeight: 500, lineHeight: 1.3, color: TINT[line.who], background: 'rgba(5,8,16,0.72)', borderRadius: 14, padding: '9px 22px' }}>{line.text}</div>
    </div>
  );
}
