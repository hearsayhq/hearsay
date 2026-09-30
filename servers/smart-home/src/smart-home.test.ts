/**
 * FR-051 gate: flawed mode produces exactly the (check, severity) pairs documented in
 * servers/smart-home/README.md; fixed has none.
 */
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { Served } from '@hearsayhq/kit';
import { McpSession, loadSuite, runSuite, type Report } from '@hearsayhq/engine';
import { startSmartHome } from './index';

let served: Served | undefined;
afterEach(async () => {
  await served?.close();
  served = undefined;
});
const suitePath = join(import.meta.dirname, '../../../suites/smart-home.yaml');
const pairs = (r: Report) => [...new Set([...r.serverFindings, ...r.cases.flatMap((c) => c.findings)].map((f) => `${f.checkId}:${f.severity}`))].sort();

describe('smart home', () => {
  it('flawed: exactly the documented findings', async () => {
    served = await startSmartHome(0, false);
    const r = await runSuite(await loadSuite(suitePath), { url: served.url });
    expect(pairs(r)).toEqual([
      'asr.robust:error',
      'case.expect:error',
      'consent.path:error',
      'latency.first_audio:warn',
      'latency.tool:error',
      'lint.destructive_annotated:warn',
      'lint.tool_names:warn',
      'speak.length:error',
      'speak.no_structured_dump:error',
    ]);
  }, 30_000);

  it('v2 (experiment v2): exactly the suite findings in README §v2', async () => {
    served = await startSmartHome(0, 'v2');
    const r = await runSuite(await loadSuite(suitePath), { url: served.url });
    expect(pairs(r)).toEqual(['asr.robust:error', 'consent.states_details:error']);
  }, 30_000);

  it('fixed: no findings', async () => {
    served = await startSmartHome(0, true);
    const r = await runSuite(await loadSuite(suitePath), { url: served.url });
    expect(pairs(r)).toEqual([]);
  });

  it('fixed on a host without elicitation: fails closed, graded info', async () => {
    served = await startSmartHome(0, true);
    const { SuiteSchema } = await import('@hearsayhq/engine');
    const suite = SuiteSchema.parse({ suite: 'no-elicitation', server: { url: served.url }, checks: ['consent.path'], cases: [{ id: 'all-off', say: 'turn off the whole house', client: { elicitation: false }, expect: { tool: 'set_scene', args: { room: 'all', state: 'off' }, confirm: 'required' } }] });
    const r = await runSuite(suite, { url: served.url });
    expect(r.cases[0]!.findings.map((f) => `${f.checkId}:${f.severity}`)).toEqual(['case.expect:error', 'consent.path:info']);
  });

  describe('fixed server behaviour', () => {
    const call = async (args: Record<string, unknown>, opts: { elicitation?: boolean; answer?: 'accept' | 'decline' } = {}) => {
      served ??= await startSmartHome(0, true);
      const s = await McpSession.open({ url: served.url, principal: `p-${Math.random()}`, elicitation: opts.elicitation ?? true });
      s.human = { answer: opts.answer ?? 'accept' };
      const r = await s.callTool('set_scene', args);
      await s.close();
      return r;
    };
    it('normalises a misheard room', async () => expect((await call({ room: 'livingroom', state: 'off' })).result.text).toBe('Living room is off. Six devices.'));
    it('asks back for an unknown room', async () => expect((await call({ room: 'garage', state: 'off' })).result).toMatchObject({ isError: true, errorCode: 'UNKNOWN_ROOM' }));
    it('turns the whole house off only after a yes', async () => {
      const r = await call({ room: 'all', state: 'off' });
      expect(r.elicitations.map((e) => e.message)).toEqual(["Turn off everything in the whole house? That's fourteen devices."]);
      expect(r.result.text).toBe('Okay, the whole house is off. Fourteen devices.');
    });
    it('fails closed without client elicitation', async () =>
      expect((await call({ room: 'all', state: 'off' }, { elicitation: false })).result).toMatchObject({ isError: true, errorCode: 'CONFIRMATION_UNAVAILABLE' }));
  });
});
