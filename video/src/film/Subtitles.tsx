/** Burned-in subtitles from second 0 (docs/09), coloured by speaker. */
import { interpolate, useCurrentFrame } from 'remotion';
import { c, sans } from '../theme';
import { LINES, type Who } from './timeline';

const TINT: Record<Who, string> = { narrator: '#F4F6FA', customer: c.amber, addon: '#7FE0C7' };

export function Subtitles() {
  const f = useCurrentFrame();
  const line = LINES.find((l) => f >= l.at - 4 && f < l.to + 12);
  if (!line) return null;
  const o = Math.min(interpolate(f, [line.at - 4, line.at + 4], [0, 1]), interpolate(f, [line.to + 4, line.to + 12], [1, 0]));
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 54, display: 'flex', justifyContent: 'center', opacity: o, pointerEvents: 'none' }}>
      <div style={{ maxWidth: 1500, textAlign: 'center', fontFamily: sans, fontSize: 34, fontWeight: 500, lineHeight: 1.3, color: TINT[line.who], background: 'rgba(5,8,16,0.62)', borderRadius: 14, padding: '10px 22px' }}>
        {line.text}
      </div>
    </div>
  );
}
