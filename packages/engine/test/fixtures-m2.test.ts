/** Failing fixtures for the checks implemented in M2 (docs/08). */
import { afterEach, describe, expect, it } from 'vitest';
import type { Served } from '@hearsayhq/kit';
import { lintServer, runSuite, type Report } from '../src/index';
import { badErrors, fakeServer, lyingReader, rawServer, strictEnum, suiteFor } from './fakes';

let served: Served | undefined;
afterEach(async () => {
  await served?.close();
  served = undefined;
});
const pairs = (r: Report) => [...new Set([...r.serverFindings, ...r.cases.flatMap((c) => c.findings)].map((f) => `${f.checkId}:${f.severity}`))].sort();

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
