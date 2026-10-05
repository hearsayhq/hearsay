/**
 * Captions from the first second: the phrase being spoken, the current word in amber. The customer
 * and the add-on (Amazon Polly) get their line whole, with who is speaking.
 */
import { useCurrentFrame } from 'remotion';
import { f, PIECES, POLLY, sceneStart } from './plan';
import { C, mono, sans } from '../film4/kit';

type Chunk = { words: Array<{ word: string; at: number; end: number }>; from: number; to: number; who?: string };

const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  for (const p of PIECES) {
    let cur: Chunk['words'] = [];
    const flush = () => { if (cur.length) out.push({ words: cur, from: f(cur[0]!.at) - 4, to: f(cur[cur.length - 1]!.end) + 12 }); cur = []; };
    for (const w of p.words) {
      cur.push(w);
      const stop = /[.?!:]["”]?$/.test(w.word) || (/[,;]$/.test(w.word) && cur.length >= 4) || cur.length >= 8;
      if (stop) flush();
    }
    flush();
  }
  for (const p of POLLY) {
    const at = sceneStart(p.scene) + p.at;
    out.push({ words: [{ word: `“${p.text}”`, at, end: at + p.seconds }], from: f(at) - 4, to: f(at + p.seconds) + 14, who: p.who });
  }
  out.sort((a, b) => a.from - b.from);
  // A chunk gives way to the next one.
  for (let i = 0; i < out.length - 1; i++) out[i]!.to = Math.min(out[i]!.to, out[i + 1]!.from);
  return out;
})();

export function Captions() {
  const frame = useCurrentFrame();
  const c = CHUNKS.find((x) => frame >= x.from && frame < x.to);
  if (!c) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 48, display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: 1500, padding: '8px 22px', borderRadius: 14, background: 'rgba(5,8,16,0.72)', fontFamily: sans, fontSize: 34, fontWeight: 600, letterSpacing: -0.2, textAlign: 'center', lineHeight: 1.3 }}>
        {c.who ? <span style={{ fontFamily: mono, fontSize: 22, letterSpacing: 2, color: c.who === 'customer' ? C.amber : C.blue, marginRight: 14 }}>{c.who.toUpperCase()}</span> : null}
        {c.words.map((w, i) => {
          if (c.who) return <span key={i} style={{ color: C.text }}>{w.word}</span>;
          const said = frame >= f(w.at);
          const now = said && frame < f(Math.max(w.end, w.at + 0.18));
          return <span key={i} style={{ color: now ? C.amber : said ? C.text : 'rgba(244,246,250,0.42)' }}>{w.word}{i < c.words.length - 1 ? ' ' : ''}</span>;
        })}
      </div>
    </div>
  );
}
