/**
 * Findings for a coding agent: compact, one line each, with the rule's source and the
 * fix. Traces only on request. Display only: verdicts come from the engine.
 */
import type { Finding, Report } from '@hearsayhq/engine';

export interface CompactFinding {
  checkId: string;
  severity: Finding['severity'];
  message: string;
  hint?: string;
  source: Finding['source'];
  caseId?: string;
  variant?: string;
}

export function compactFindings(r: Report): CompactFinding[] {
  const out: CompactFinding[] = r.serverFindings.map((f) => ({ checkId: f.checkId, severity: f.severity, message: f.message, ...(f.hint ? { hint: f.hint } : {}), source: f.source }));
  for (const c of r.cases)
    for (const f of c.findings)
      out.push({ checkId: f.checkId, severity: f.severity, message: f.message, ...(f.hint ? { hint: f.hint } : {}), source: f.source, caseId: c.caseId, variant: c.variant });
  const rank = { error: 0, warn: 1, info: 2 } as const;
  // A changed suite invalidates everything else in the run, so it comes first.
  const first = (f: CompactFinding) => (f.checkId === 'suite.integrity' ? 0 : 1);
  return out.sort((a, b) => first(a) - first(b) || rank[a.severity] - rank[b.severity] || a.checkId.localeCompare(b.checkId));
}

export function summarize(r: Report, reportPath: string, opts: { verbose?: boolean; rerun?: string[] } = {}) {
  const findings = compactFindings(r);
  const verdict = r.summary.errors ? 'red' : 'green';
  const lines = [
    `${r.suite}: ${verdict.toUpperCase()} · ${r.summary.errors} errors, ${r.summary.warnings} warnings, ${r.summary.infos} info · ${r.summary.cases} case runs${opts.rerun ? ` (rerun of failed: ${opts.rerun.join(', ')})` : ''}`,
  ];
  for (const f of findings) {
    lines.push(`${f.severity === 'error' ? '✗' : f.severity === 'warn' ? '!' : 'i'} ${f.severity} ${f.checkId}${f.caseId ? ` [${f.caseId}/${f.variant}]` : ''}: ${f.message}`);
    if (f.hint) lines.push(`    fix: ${f.hint}`);
    lines.push(`    rule: [${f.source.kind}] ${f.source.ref}`);
  }
  if (r.skippedChecks.length) lines.push(`skipped (not implemented yet): ${r.skippedChecks.join(', ')}`);
  lines.push(`report: ${reportPath}`);
  const traces = opts.verbose
    ? r.cases.map((c) => ({ caseId: c.caseId, variant: c.variant, turns: c.trace.turns.map((t) => ({ heard: t.heard, setupOf: t.setupOf, calls: t.toolCalls.map((x) => ({ tool: x.tool, args: x.args, isError: x.result.isError, latencyMs: Math.round(x.latencyMs) })), spoken: t.spoken })) }))
    : undefined;
  if (traces)
    for (const t of traces) {
      lines.push(`trace ${t.caseId}/${t.variant}:`);
      for (const turn of t.turns) lines.push(`  ${turn.setupOf ? '(setup) ' : ''}"${turn.heard}" → ${turn.calls.map((c) => `${c.tool}(${JSON.stringify(c.args)}) ${c.latencyMs}ms`).join(', ') || 'no call'} → "${turn.spoken}"`);
    }
  return {
    text: lines.join('\n'),
    structured: { suite: r.suite, verdict, summary: r.summary, findings, skippedChecks: r.skippedChecks, reportPath, ...(traces ? { traces } : {}) },
  };
}
