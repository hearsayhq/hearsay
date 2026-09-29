export * from './trace';
export * from './orchestrator';
export * from './catalog';
export * from './report';
export { SuiteSchema, loadSuite, turnChecksFor, serverChecksFor, type Suite, type SuiteCase } from './suite';

import type { Report } from './report';
import type { Suite } from './suite';

export interface RunOptions {
  /** Only run these case ids. */
  only?: string[];
  /** Override the suite's orchestrator. */
  orchestrator?: Suite['orchestrator'];
  onTrace?: (caseId: string, variant: string) => void;
}

/** M1 (docs/07). Connect, run cases × variants, apply checks, build the report. */
export async function runSuite(_suite: Suite, _opts: RunOptions = {}): Promise<Report> {
  throw new Error('runSuite is milestone M1 (docs/07_IMPLEMENTATION_PLAN.md) and not implemented yet.');
}
