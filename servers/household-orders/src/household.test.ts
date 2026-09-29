/**
 * M4 gate (docs/07): every consent.* and mandate.* check passes on Household Orders, with
 * and without client elicitation, and fails on the flawed build made to violate it.
 */
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { Served } from '@hearsayhq/kit';
import { loadSuite, runSuite, type Report } from '@hearsayhq/engine';
import { startHousehold } from './index';

let served: Served | undefined;
afterEach(async () => {
  await served?.close();
  served = undefined;
});
const suitePath = join(import.meta.dirname, '../../../suites/household-orders.yaml');
const pairs = (r: Report) => [...new Set([...r.serverFindings, ...r.cases.flatMap((c) => c.findings)].map((f) => `${f.checkId}:${f.severity}`))].sort();
const run = async (flawed: boolean, ttl = 60) => {
  served = await startHousehold(0, flawed, ttl);
  return runSuite(await loadSuite(suitePath), { url: served.url });
};

describe('household orders', () => {
  it('fixed: only the verbal tier is graded (warn), by design', async () => expect(pairs(await run(false))).toEqual(['consent.path:warn']), 30_000);

  it('fixed with 2-second tokens: expiry is probed, not just declared', async () => expect(pairs(await run(false, 2))).toEqual(['consent.path:warn']), 30_000);

  it('flawed: every consent and mandate check fails', async () => {
    const found = pairs(await run(true, 2));
    for (const p of [
      'consent.decline_holds:error', 'consent.misheard_amount:error', 'consent.over_confirmation:warn', 'consent.states_details:error', 'consent.verbal_token:error',
      'mandate.expiry:error', 'mandate.injection:error', 'mandate.principal_bound:warn', 'mandate.schema_ignoring_caller:error', 'mandate.version_race:error',
    ])
      expect(found).toContain(p);
  }, 60_000);

  it('never commits "fifty" when "fifteen" was meant', async () => {
    const r = await run(false);
    const v = r.cases.find((c) => c.caseId === 'misheard-amount' && c.variant !== 'clean')!;
    expect(v.trace.turns.at(-1)).toMatchObject({ heard: 'add fifty dollars of fruit', toolCalls: [{ result: { errorCode: 'LIMIT_EXCEEDED' } }] });
  }, 30_000);
});
