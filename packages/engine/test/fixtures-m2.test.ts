/** Failing fixtures for the checks implemented in M2 (docs/08). */
import { afterEach, describe, expect, it } from 'vitest';
import type { Served } from '@hearsayhq/kit';
import { lintServer, runSuite, type Report } from '../src/index';
import { badErrors, fakeServer, growingToolsServer, lyingReader, rawServer, strictEnum, suiteFor, vagueTimer } from './fakes';

let served: Served | undefined;
afterEach(async () => {
  await served?.close();
  served = undefined;
});
const pairs = (r: Report) => [...new Set([...r.serverFindings, ...r.cases.flatMap((c) => c.findings)].filter((f) => !f.checkId.startsWith('coverage.')).map((f) => `${f.checkId}:${f.severity}`))].sort();

describe('protocol.refusal_as_result', () => {
  const suite = (url: string) => suiteFor(url, { checks: ['protocol.refusal_as_result'], cases: [{ id: 'wine', say: 'add wine', call: { tool: 'stage_item', args: { sku: 'sku-wine' } }, expect: { tool: 'stage_item' } }] });

  it('fails the SDK-wrapped -32602 from a strict schema enum', async () => {
    served = await fakeServer(strictEnum);
    expect(pairs(await runSuite(suite(served.url)))).toEqual(['protocol.refusal_as_result:error']);
  });

  it('fails a raw JSON-RPC error answering tools/call', async () => {
    served = await rawServer((v) => v, [{ name: 'stage_item', description: 'Use when adding an item to the cart.', inputSchema: { type: 'object', properties: { sku: { type: 'string', description: 'Item.' } } } }]);
    expect(pairs(await runSuite(suite(served.url)))).toEqual(['protocol.refusal_as_result:error']);
  });
});

describe('lint.error_actionable', () => {
  it('errors on stack traces and codes, warns on errors that name no next step', async () => {
    served = await fakeServer(badErrors);
    const r = await runSuite(suiteFor(served.url, { checks: ['lint.error_actionable'], cases: [
      { id: 'weather', say: 'what is the weather', expect: { tool: 'fetch_weather' } },
      { id: 'news', say: 'read the news', expect: { tool: 'fetch_news' } },
    ] }));
    expect(r.cases.map((c) => c.findings.map((f) => `${f.checkId}:${f.severity}`))).toEqual([['lint.error_actionable:error'], ['lint.error_actionable:warn']]);
  });
});

describe('lint.destructive_annotated probe', () => {
  it('errors when a readOnlyHint tool reads differently twice', async () => {
    served = await fakeServer(lyingReader);
    const r = await lintServer(served.url);
    expect(r.serverFindings.filter((f) => f.checkId === 'lint.destructive_annotated').map((f) => f.severity)).toEqual(['error']);
  });
});

describe('protocol.list_changed', () => {
  it('warns when tools appear mid-session without a notification', async () => {
    served = await growingToolsServer();
    const r = await runSuite(suiteFor(served.url, { checks: ['protocol.list_changed'], cases: [{ id: 'grant', say: 'grant access', expect: { tool: 'grant_access' } }] }));
    expect(r.cases[0]!.findings).toEqual([expect.objectContaining({ checkId: 'protocol.list_changed', severity: 'warn' })]);
    expect(r.cases[0]!.trace.toolListDrift).toMatchObject({ notified: false, added: ['buy_now'] });
  });
});

describe('asr.robust: the same reply to different arguments', () => {
  it('fails "Timer started." for fifteen and for fifty minutes (nothing tells the person what was heard)', async () => {
    served = await fakeServer(vagueTimer);
    const r = await runSuite(suiteFor(served.url, { cases: [{ id: 'pasta', say: 'set a timer for fifteen minutes', expect: { tool: 'timer_start', args: { minutes: 15 } }, fuzz: ['asr.number_confusion'], checks: ['asr.robust'] }] }));
    const f = r.cases.flatMap((c) => c.findings).find((x) => x.checkId === 'asr.robust');
    expect(f).toMatchObject({ severity: 'error', evidence: { args: { minutes: 50 }, cleanArgs: { minutes: 15 } } });
  });
});

describe('lintServer options (FR-062 scan)', () => {
  const ok = () => '2025-11-25';
  const reader = [{ name: 'read_status', description: 'Use when the person asks for the status.', inputSchema: { type: 'object', properties: {} }, annotations: { readOnlyHint: true } }];

  it('sends one bearer on every session, including the probes', async () => {
    const seen: Array<string | undefined> = [];
    served = await rawServer(ok, [], (r) => seen.push(r.authorization));
    await lintServer(served.url, { principal: 'token-1' });
    expect(seen.length).toBeGreaterThan(2);
    expect(new Set(seen)).toEqual(new Set(['Bearer token-1']));
  });

  it('sends no Authorization header for an empty principal', async () => {
    const seen: Array<string | undefined> = [];
    served = await rawServer(ok, [], (r) => seen.push(r.authorization));
    await lintServer(served.url, { principal: '' });
    expect(new Set(seen)).toEqual(new Set([undefined]));
  });

  it('calls no tool when callTools is false; the annotation probe does by default', async () => {
    const methods: string[] = [];
    served = await rawServer(ok, reader, (r) => methods.push(r.method));
    await lintServer(served.url, { callTools: false });
    expect(methods).toContain('tools/list');
    expect(methods).not.toContain('tools/call');
    await lintServer(served.url).catch(() => undefined);
    expect(methods).toContain('tools/call');
  });
});
