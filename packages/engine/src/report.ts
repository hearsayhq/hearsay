import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { Question, Severity, Source } from './catalog';
import type { OrchestratorMode } from './orchestrator';
import type { Trace } from './trace';

/** One check's verdict. NFR-2: always names the check, the evidence, the source and a fix. */
export interface Finding {
  checkId: string;
  severity: Severity;
  /** Which of the four questions (or the precondition) this finding answers. */
  question: Question;
  /** The rule behind the threshold that fired. */
  source: Source;
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
  /** A holdout case (FR-018): never shown to agents, counted apart. */
  holdout?: true;
}

export interface Report {
  suite: string;
  startedAt: string;
  orchestrator: OrchestratorMode;
  /** PRNG seed for perturbations; recorded so a run can be repeated (NFR-1). */
  seed: number;
  /** The server's tool list as first seen. */
  tools: Tool[];
  serverFindings: Finding[];
  cases: CaseResult[];
  /** Checks the suite asked for that are not implemented yet (FR-024). Never counted as passed. */
  skippedChecks: string[];
  /** Visible cases and server findings. */
  summary: { cases: number; failed: number; errors: number; warnings: number; infos: number; skipped: number };
  /** Holdout cases, counted apart; present only for `--holdout` runs. */
  holdout?: { cases: number; failed: number; errors: number; warnings: number; infos: number };
}

/** CI gate (FR-030): any error-severity finding, visible or holdout, fails the run. */
export const exitCodeFor = (r: Report): 0 | 1 => (r.summary.errors > 0 || (r.holdout?.errors ?? 0) > 0 ? 1 : 0);
