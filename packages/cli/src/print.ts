/** Human summary of a report (docs/02). Display only: every verdict comes from the engine. */
import { QUESTIONS, QUESTION_ORDER, type Finding, type Report } from '@hearsayhq/engine';

const MARK = { error: '✗', warn: '!', info: 'i' } as const;
const n = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

interface Row {
  caseId: string;
  variant: string;
  f: Finding;
}

export function printReport(r: Report, reportPath: string, verbose = false): void {
  const s = r.summary;
  const h = r.holdout;
  // Cases are the suite's; runs are case × variant. Holdouts are counted apart, never mixed in.
  console.log(`${r.suite} · ${s.cases} cases · ${s.runs} runs with variants${h ? ` · holdout: ${h.cases} cases, ${h.runs} runs, reported apart` : ''} · ${r.orchestrator} · seed ${r.seed}`);

  const rows: Row[] = [
    ...r.serverFindings.map((f) => ({ caseId: '(server)', variant: '', f })),
    ...r.cases.filter((c) => !c.holdout).flatMap((c) => c.findings.map((f) => ({ caseId: c.caseId, variant: c.variant, f }))),
  ];
  const hidden: Row[] = r.cases.filter((c) => c.holdout).flatMap((c) => c.findings.map((f) => ({ caseId: c.caseId, variant: c.variant, f })));
  const w1 = Math.max(8, ...rows.map((x) => x.caseId.length));
  const w2 = Math.max(5, ...rows.map((x) => x.variant.length));
  const w3 = Math.max(10, ...rows.map((x) => x.f.checkId.length));
  for (const q of QUESTION_ORDER) {
    const group = rows.filter((x) => x.f.question === q);
    if (!group.length) continue;
    console.log(`\n${QUESTIONS[q]}`);
    for (const { caseId, variant, f } of group) {
      console.log(`${MARK[f.severity]} ${caseId.padEnd(w1)}  ${variant.padEnd(w2)}  ${f.checkId.padEnd(w3)}  ${f.severity.padEnd(5)}  ${f.message}`);
      if (verbose) {
        if (f.hint) console.log(`  ${''.padEnd(w1 + w2 + w3 + 4)}hint: ${f.hint}`);
        console.log(`  ${''.padEnd(w1 + w2 + w3 + 4)}source: [${f.source.kind}] ${f.source.ref}${f.source.url ? ` ${f.source.url}` : ''}`);
      }
    }
  }
  if (!rows.length) console.log('\n✓ no findings');
  if (r.holdout) {
    console.log(`\nHoldout (${r.holdout.cases} cases, ${r.holdout.runs} runs, never shown to agents)`);
    for (const { caseId, variant, f } of hidden) console.log(`${MARK[f.severity]} ${caseId.padEnd(w1)}  ${variant.padEnd(w2)}  ${f.checkId.padEnd(w3)}  ${f.severity.padEnd(5)}  ${f.message}`);
    if (!hidden.length) console.log('✓ no findings');
  }

  if (verbose)
    for (const c of r.cases) {
      console.log(`\n${c.caseId} · ${c.variant} · ${c.trace.principal}`);
      for (const t of c.trace.turns) {
        const spans = t.spans.map((s) => `${s.kind}${s.modeled ? '~' : ''} ${Math.round(s.endMs - s.startMs)}ms`).join(' · ');
        const said = t.heard === t.utterance ? `"${t.heard}"` : `"${t.utterance}" heard as "${t.heard}"`;
        console.log(`  ${t.setupOf ? `(setup ${t.setupOf}) ` : ''}${said} → ${t.toolCalls.map((x) => x.tool).join(', ') || 'no call'} → "${t.spoken}"`);
        console.log(`    ${spans}`);
      }
    }

  const skipped = s.skipped ? ` · ${s.skipped} skipped (planned): ${r.skippedChecks.join(', ')}` : '';
  console.log(`\n${n(s.errors, 'error')} · ${n(s.warnings, 'warning')} · ${s.infos} info · ${s.failedRuns} of ${n(s.runs, 'run')} failed${skipped}`);
  if (h) console.log(`holdout: ${n(h.errors, 'error')} · ${n(h.warnings, 'warning')} · ${h.failedRuns} of ${n(h.runs, 'run')} failed (${n(h.cases, 'case')})`);
  console.log(`report: ${reportPath}`);
}
