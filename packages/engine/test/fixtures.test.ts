/**
 * Failing fixtures for every check implemented in M1 (docs/08): each check must
 * fire on a server built to violate it, with the expected id and severity.
 */
import { afterEach, describe, expect, it } from 'vitest';
import type { Served } from '@hearsayhq/kit';
import { runSuite, type Report } from '../src/index';
import { fakeServer, rawServer, slowTool, suiteFor, twoTools } from './fakes';

let served: Served | undefined;
afterEach(async () => {
  await served?.close();
  served = undefined;
});

const findings = (r: Report) => [...r.serverFindings, ...r.cases.flatMap((c) => c.findings)];
const pairs = (r: Report) => findings(r).map((f) => `${f.checkId}:${f.severity}`);

describe('latency.tool', () => {
  it('fails a tool slower than 500 ms as error, with the Amazon source', async () => {
    served = await fakeServer(slowTool(700));
    const r = await runSuite(suiteFor(served.url, { checks: ['latency.tool'], cases: [{ id: 'slow', say: 'look it up', expect: { tool: 'slow_lookup' } }] }));
    const f = findings(r).find((x) => x.checkId === 'latency.tool');
    expect(f).toMatchObject({ severity: 'error', question: 'wait', source: { kind: 'amazon-fr' } });
    expect(r.summary.errors).toBe(1);
  });

  it('passes a fast tool', async () => {
    served = await fakeServer(slowTool(0));
    const r = await runSuite(suiteFor(served.url, { checks: ['latency.tool'], cases: [{ id: 'fast', say: 'look it up', expect: { tool: 'slow_lookup' } }] }));
    expect(pairs(r)).toEqual([]);
  });
});

describe('case.expect', () => {
  const run = async (c: Record<string, unknown>) => {
    served = await fakeServer(twoTools);
    return runSuite(suiteFor(served.url, { cases: [{ id: 'case', say: 'turn off the kitchen lights', ...c }] }));
  };

  it('fails when the wrong tool is called', async () => {
    const r = await run({ call: { tool: 'lights_on', args: { room: 'kitchen' } }, expect: { tool: 'lights_off' } });
    expect(findings(r)).toEqual([expect.objectContaining({ checkId: 'case.expect', severity: 'error', question: 'hear' })]);
  });

  it('fails on other arguments, forbidden arguments, missing confirmation and missing words', async () => {
    const r = await run({
      call: { tool: 'lights_off', args: { room: 'all' } },
      expect: { tool: 'lights_off', args: { room: 'kitchen' }, argsMustNotContain: { room: 'ALL' }, confirm: 'required', spokenIncludes: ['kitchen'] },
    });
    expect(findings(r).map((f) => [f.question, f.message.split(' ').slice(0, 3).join(' ')])).toEqual([
      ['hear', 'lights_off was called'],
      ['hear', 'lights_off was called'],
      ['agree', 'expected the person'],
      ['listen', 'spoken reply does'],
    ]);
  });

  it('fails a missing refusal code', async () => {
    const r = await run({ call: { tool: 'lights_off', args: { room: 'kitchen' } }, expect: { refusal: 'OUT_OF_SCOPE' } });
    expect(findings(r)[0]).toMatchObject({ checkId: 'case.expect', question: 'agree' });
  });

  it('passes a met expectation', async () => {
    const r = await run({ expect: { tool: 'lights_off', args: { room: ' Kitchen ' }, spokenIncludes: ['KITCHEN'] } });
    expect(pairs(r)).toEqual([]);
  });
});

describe('protocol.version', () => {
  const suite = (url: string) => suiteFor(url, { checks: ['protocol.version'], cases: [{ id: 'noop', say: 'hello', expect: { noTool: true } }] });

  it('is an error when the server negotiates an older version than 2025-11-25', async () => {
    served = await rawServer(() => '2025-06-18');
    const r = await runSuite(suite(served.url));
    expect(r.serverFindings).toEqual([expect.objectContaining({ checkId: 'protocol.version', severity: 'error', question: 'connect' })]);
  });

  it('is a warning when a client offering 2025-03-26 is turned away', async () => {
    served = await rawServer((v) => (v === '2025-03-26' ? new Error('Unsupported protocol version') : v));
    const r = await runSuite(suite(served.url));
    expect(r.serverFindings).toEqual([expect.objectContaining({ checkId: 'protocol.version', severity: 'warn', source: expect.objectContaining({ kind: 'amazon-fr' }) })]);
  });

  it('passes an SDK server', async () => {
    served = await fakeServer(twoTools);
    expect((await runSuite(suite(served.url))).serverFindings).toEqual([]);
  });
});

describe('skipped checks (FR-024)', () => {
  it('lists planned checks instead of passing them', async () => {
    served = await fakeServer(twoTools);
    const r = await runSuite(suiteFor(served.url, { checks: ['mandate.expiry', 'latency.tool'], cases: [{ id: 'c', say: 'lights off', expect: { tool: 'lights_off', args: { room: 'kitchen' } }, checks: ['asr.robust'] }] }));
    expect(r.skippedChecks).toEqual(['asr.robust', 'mandate.expiry']);
    expect(r.summary.skipped).toBe(2);
  });
});
