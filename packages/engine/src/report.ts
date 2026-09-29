import type { Severity } from './catalog';
import type { Trace } from './trace';

export interface Finding {
  checkId: string;
  severity: Severity;
  message: string;
  /** What to change in the server. */
  hint?: string;
  turnId?: string;
  evidence?: Record<string, unknown>;
}

export interface CaseResult {
  caseId: string;
  variant: string;
  trace: Trace;
  findings: Finding[];
  verdict: 'pass' | 'fail';
}

export interface Report {
  suite: string;
  startedAt: string;
  serverFindings: Finding[];
  cases: CaseResult[];
  summary: { cases: number; failed: number; errors: number; warnings: number };
}

/** CI gate (FR-030): any error-severity finding fails the run. */
export const exitCodeFor = (r: Report): 0 | 1 => (r.summary.errors > 0 ? 1 : 0);
