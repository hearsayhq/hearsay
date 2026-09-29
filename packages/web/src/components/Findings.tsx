/** Findings grouped by the four questions (and the precondition), as the engine produced them. */
import type { CatalogResponse, Finding } from '@hearsayhq/engine/types';
import { SourceBadge } from './SourceBadge';

export function FindingItem({ f }: { f: Finding }) {
  return (
    <li className={`finding sev-${f.severity}`}>
      <div className="finding-head">
        <span className={`sev sev-${f.severity}`}>{f.severity}</span>
        <code>{f.checkId}</code>
        <SourceBadge source={f.source} />
      </div>
      <p>{f.message}</p>
      {f.hint && <p className="hint">{f.hint}</p>}
    </li>
  );
}

/** The same check at the same severity, several times (cases, variants, turns): shown once, the rest folded. */
function FindingGroup({ group }: { group: Finding[] }) {
  const [first, ...rest] = group;
  return (
    <li className="group">
      <ul>
        <FindingItem f={first!} />
      </ul>
      {rest.length > 0 && (
        <details className="more">
          <summary>{rest.length} more like this</summary>
          <ul>{rest.map((f, i) => <FindingItem key={i} f={f} />)}</ul>
        </details>
      )}
    </li>
  );
}

export function FindingsByQuestion({ findings, catalog, emptyText }: { findings: Finding[]; catalog: CatalogResponse | undefined; emptyText: string }) {
  if (!catalog) return null;
  if (!findings.length) return <p className="muted">{emptyText}</p>;
  return (
    <div className="questions">
      {catalog.questions.map((q) => {
        const groups = new Map<string, Finding[]>();
        for (const f of findings.filter((x) => x.question === q.id)) groups.set(`${f.checkId}:${f.severity}`, [...(groups.get(`${f.checkId}:${f.severity}`) ?? []), f]);
        if (!groups.size) return null;
        return (
          <section key={q.id} className="question">
            <h3>{q.text}</h3>
            <ul>{[...groups].map(([k, g]) => <FindingGroup key={k} group={g} />)}</ul>
          </section>
        );
      })}
    </div>
  );
}
