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
  const run = (caseId: string, variant = 'clean') => report.cases.find((c) => c.caseId === caseId && c.variant === variant)!;
  it('runs every case and variant', () =>
    expect(report.cases.map((c) => `${c.caseId}/${c.variant}`)).toEqual(['start-pasta-timer/clean', 'start-pasta-timer/asr.number_confusion#1', 'start-egg-timer/clean', 'start-sauce-timer/clean', 'start-sauce-timer/asr.homophones#1', 'list-timers/clean', 'cancel-ambiguous/clean', 'recipe-step-out-of-range/clean']));
  it('reads the duration back', () => expect(run('start-pasta-timer').trace.turns[0]!.spoken).toBe('Pasta timer set for fifteen minutes.'));
  it('reads a misheard duration back, so the person can correct it (asr.robust passes)', () =>
    expect(run('start-pasta-timer', 'asr.number_confusion#1').trace.turns[0]).toMatchObject({ heard: 'set a pasta timer for fifty minutes', spoken: 'Pasta timer set for fifty minutes.' }));
  it('asks which timer when two are running', () =>
    expect(run('cancel-ambiguous').trace.turns.at(-1)).toMatchObject({ toolCalls: [{ result: { isError: true, errorCode: 'AMBIGUOUS' } }] }));
  it('asks for the minutes when "eight" was heard as "ate" (looseInt, no schema error read out)', () =>
    expect(run('start-sauce-timer', 'asr.homophones#1').trace.turns[0]).toMatchObject({ heard: 'start a sauce timer for ate minutes', spoken: 'How many minutes should the timer run? Say a number from one to two hundred forty.' }));
  it('answers "step forty" with the number of steps', () =>
    expect(run('recipe-step-out-of-range').trace.turns[0]).toMatchObject({ toolCalls: [{ result: { isError: true, errorCode: 'NO_SUCH_STEP' } }], spoken: 'The recipe has seven steps. Which one would you like?' }));
  it('keys timers by principal, so cases do not see each other', () =>
    expect(run('list-timers').trace.turns.at(-1)!.spoken).toBe('Two timers: egg with seven minutes left and pasta with fifteen minutes left.'));
});

describe('kitchen flawed (HEARSAY_FIXED=0, the experiment build)', () => {
  it('fails its suite on every question it is built to fail', async () => {
    const flawed = await startKitchen(0, true);
    try {
      const r = await runSuite(await loadSuite(join(import.meta.dirname, '../../../suites/kitchen.yaml')), { url: flawed.url });
      const pairs = [...new Set([...r.serverFindings, ...r.cases.flatMap((c) => c.findings)].map((f) => `${f.checkId}:${f.severity}`))].sort();
      expect(pairs).toEqual([
        'asr.robust:error', 'case.expect:error', 'lint.descriptions:warn', 'lint.destructive_annotated:warn', 'lint.error_actionable:error',
        'lint.tool_names:warn', 'protocol.refusal_as_result:error', 'speak.no_structured_dump:error',
      ]);
    } finally {
      await flawed.close();
    }
  }, 30_000);
});
