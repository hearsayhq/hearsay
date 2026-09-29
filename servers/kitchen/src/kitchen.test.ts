/** Kitchen passes its own suite (FR-050): green is what this server is for. */
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Served } from '@hearsayhq/kit';
import { loadSuite, runSuite, type Report } from '@hearsayhq/engine';
import { startKitchen } from './index';

let served: Served;
let report: Report;

beforeAll(async () => {
  served = await startKitchen(0);
  const suite = await loadSuite(join(import.meta.dirname, '../../../suites/kitchen.yaml'));
  report = await runSuite(suite, { url: served.url });
});
afterAll(() => served.close());

describe('kitchen suite', () => {
  it('has no findings', () => expect([...report.serverFindings, ...report.cases.flatMap((c) => c.findings)]).toEqual([]));
  it('runs every case', () => expect(report.cases.map((c) => c.caseId)).toEqual(['start-pasta-timer', 'start-egg-timer', 'list-timers', 'cancel-ambiguous']));
  it('reads the duration back', () => expect(report.cases[0]!.trace.turns[0]!.spoken).toBe('Pasta timer set for fifteen minutes.'));
  it('asks which timer when two are running', () =>
    expect(report.cases[3]!.trace.turns.at(-1)).toMatchObject({ toolCalls: [{ result: { isError: true, errorCode: 'AMBIGUOUS' } }] }));
  it('keys timers by principal, so cases do not see each other', () =>
    expect(report.cases[2]!.trace.turns.at(-1)!.spoken).toBe('Two timers: egg with seven minutes left and pasta with fifteen minutes left.'));
});
