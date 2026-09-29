/** Human summary of a report (docs/02). Display only: every verdict comes from the engine. */
import { QUESTIONS, QUESTION_ORDER, type Finding, type Report } from '@hearsayhq/engine';

const MARK = { error: '✗', warn: '!', info: 'i' } as const;

interface Row {
  caseId: string;
  variant: string;
  f: Finding;
}

export function printReport(r: Report, reportPath: string, verbose = false): void {
  const variants = r.cases.length;
  const caseCount = new Set(r.cases.map((c) => c.caseId)).size;
  console.log(`${r.suite} · ${caseCount} cases · ${variants} variants · ${r.orchestrator} · seed ${r.seed}`);

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
    console.log(`\nHoldout (${r.holdout.cases} case runs, never shown to agents)`);
    for (const { caseId, variant, f } of hidden) console.log(`${MARK[f.severity]} ${caseId.padEnd(w1)}  ${variant.padEnd(w2)}  ${f.checkId.padEnd(w3)}  ${f.severity.padEnd(5)}  ${f.message}`);
    if (!hidden.length) console.log('✓ no findings');
  }

  if (verbose)
    for (const c of r.cases) {
      console.log(`\n${c.caseId} · ${c.variant} · ${c.trace.principal}`);
      for (const t of c.trace.turns) {
        const spans = t.spans.map((s) => `${s.kind}${s.modeled ? '~' : ''} ${Math.round(s.endMs - s.startMs)}ms`).join(' · ');
        console.log(`  ${t.setupOf ? `(setup ${t.setupOf}) ` : ''}"${t.heard}" → ${t.toolCalls.map((x) => x.tool).join(', ') || 'no call'} → "${t.spoken}"`);
        console.log(`    ${spans}`);
      }
    }

  const s = r.summary;
  const skipped = s.skipped ? ` · ${s.skipped} skipped (planned): ${r.skippedChecks.join(', ')}` : '';
  console.log(`\n${s.errors} errors · ${s.warnings} warnings · ${s.infos} info${skipped}`);
  if (r.holdout) console.log(`holdout: ${r.holdout.errors} errors · ${r.holdout.warnings} warnings · ${r.holdout.failed}/${r.holdout.cases} case runs failed`);
  console.log(`report: ${reportPath}`);
}
