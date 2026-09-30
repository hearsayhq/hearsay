/** Findings of a real run (src/data), grouped by question, in the video's look. */
import data from '../data/smart-home-flawed.json';
import { c, mono, sans } from '../theme';

type F = { checkId: string; severity: 'error' | 'warn' | 'info'; message: string; source: { kind: string }; question: string };
const QUESTIONS: Array<[string, string]> = [
  ['hear', 'Did it hear me right?'],
  ['wait', 'Do I have to wait?'],
  ['listen', 'Can I listen to this?'],
  ['agree', 'Did I agree?'],
];

const report = data as unknown as { serverFindings: F[]; cases: Array<{ findings: F[] }> };
const all: F[] = [...report.serverFindings, ...report.cases.flatMap((x) => x.findings)];
// One line per check and question, the worst severity first: what a person would read first.
export const findingRows = QUESTIONS.map(([q, title]) => {
  const seen = new Map<string, F>();
  for (const f of all.filter((x) => x.question === q)) if (!seen.has(f.checkId) || f.severity === 'error') seen.set(f.checkId, f);
  return { q, title, rows: [...seen.values()].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'error' ? -1 : 1)).slice(0, 3) };
});

export function FindingsPanel({ reveal = 1 }: { reveal?: number }) {
  let i = 0;
  return (
    <div style={{ fontFamily: sans, color: c.text, display: 'flex', flexDirection: 'column', gap: 26 }}>
      {findingRows.map((g) => (
        <div key={g.q}>
          <div style={{ fontSize: 22, fontWeight: 600, color: c.muted, letterSpacing: 0.3, marginBottom: 10 }}>{g.title}</div>
          {g.rows.map((f) => {
            const shown = Math.min(Math.max(reveal * 12 - i++, 0), 1);
            return (
              <div key={f.checkId} style={{ opacity: shown, transform: `translateY(${(1 - shown) * 14}px)`, display: 'flex', alignItems: 'baseline', gap: 16, padding: '10px 0', borderBottom: `1px solid ${c.line}` }}>
                <span style={{ width: 12, height: 12, borderRadius: 6, flex: 'none', background: f.severity === 'error' ? c.red : c.amber, transform: 'translateY(-2px)' }} />
                <span style={{ fontFamily: mono, fontSize: 22, color: c.text, width: 400, flex: 'none' }}>{f.checkId}</span>
                <span style={{ fontSize: 22, color: '#C9D1E0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 470 }}>{f.message}</span>
                <span style={{ marginLeft: 'auto', fontFamily: mono, fontSize: 16, color: c.amber, border: `1px solid ${c.amberSoft}`, background: c.amberSoft, borderRadius: 8, padding: '3px 8px', whiteSpace: 'nowrap', flex: 'none' }}>{f.source.kind}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
