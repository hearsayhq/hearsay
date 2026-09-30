/** A suite run from the console (FR-042): the same report the CLI writes. */
import type { CatalogResponse, RunResponse } from '@hearsayhq/engine/types';
import { FindingsByQuestion } from './Findings';

export function ReportView({ run, catalog, onClose }: { run: RunResponse; catalog: CatalogResponse | undefined; onClose: () => void }) {
  const { report: r, reportPath } = run;
  const findings = [...r.serverFindings, ...r.cases.flatMap((c) => c.findings)];
  const red = r.summary.errors > 0;
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
  return (
    <section className="panel report">
      <header className="report-head">
        <div>
          <p className="eyebrow">Suite run · {r.suite} · {r.orchestrator} · seed {r.seed}</p>
          <h2 className={red ? 'verdict red' : 'verdict green'}>{red ? 'Red: CI would fail' : 'Green: CI would pass'}</h2>
          <p className="muted">
            {plural(r.summary.cases, 'case')} · {plural(r.summary.runs, 'run')} with variants · {plural(r.summary.errors, 'error')} · {plural(r.summary.warnings, 'warning')} · {r.summary.infos} info
            {r.skippedChecks.length > 0 && <> · skipped: {r.skippedChecks.join(', ')}</>}
          </p>
        </div>
        <button className="ghost" onClick={onClose}>Close</button>
      </header>
      <FindingsByQuestion findings={findings} catalog={catalog} emptyText="No findings." />
      <details className="cases">
        <summary>Runs: cases and their misheard variants ({r.cases.length})</summary>
        <table>
          <thead><tr><th>Case</th><th>Said</th><th>Heard</th><th>Reply</th><th>Verdict</th></tr></thead>
          <tbody>
            {r.cases.map((c) => {
              const turns = c.trace.turns.filter((t) => !t.setupOf);
              return (
                <tr key={`${c.caseId}-${c.variant}`}>
                  <td><code>{c.caseId}</code>{c.variant !== 'clean' && <span className="muted"> · {c.variant}</span>}</td>
                  <td>{turns.map((t) => t.utterance).join(' / ')}</td>
                  <td>{turns.map((t, i) => <span key={i} className={t.heard !== t.utterance ? 'misheard' : undefined}>{i ? ' / ' : ''}{t.heard}</span>)}</td>
                  <td className="spoken">{turns.map((t) => t.spoken).join(' / ')}</td>
                  <td className={c.verdict === 'pass' ? 'ok' : 'bad'}>{c.verdict}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </details>
      <p className="muted small">Written to <code>{reportPath}</code></p>
    </section>
  );
}
