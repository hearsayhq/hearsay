/** FR-012/013 without network: llm mode through a fake model, recorded, replayed twice identically. */
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Served } from '@hearsayhq/kit';
import { startSmartHome } from '@hearsayhq/server-smart-home';
import { RecordingProvider, ReplayMismatch, ReplayProvider, SuiteSchema, hashRequest, loadSuite, runSuite, type Cassette, type Report } from '../src/index';
import { FakeHomeModel } from './fake-model';

let served: Served;
let cassette: Cassette;
const suitePath = join(import.meta.dirname, '../../../suites/smart-home.yaml');
const findings = (r: Report) => r.cases.flatMap((c) => c.findings.map((f) => `${c.caseId}/${c.variant} ${f.checkId}:${f.severity}`)).concat(r.serverFindings.map((f) => `server ${f.checkId}:${f.severity}`));
const llmSuite = async () => SuiteSchema.parse({ ...(await loadSuite(suitePath)), orchestrator: 'llm' });

beforeAll(async () => {
  served = await startSmartHome(0, true);
});
afterAll(() => served.close());

describe('llm mode, record and replay', () => {
  it('plans from the words heard, including misheard variants', async () => {
    cassette = { provider: 'fake:home', model: 'fake', recordedAt: '2026-09-30T00:00:00Z', entries: {} };
    const model = new FakeHomeModel();
    const r = await runSuite(await llmSuite(), { url: served.url, provider: new RecordingProvider(model, cassette) });
    expect(r.orchestrator).toBe('llm');
    expect(r.cases.find((c) => c.variant === 'asr.compound_split#1')!.trace.turns.at(-1)).toMatchObject({ heard: 'turn off everything in the livingroom', spoken: 'Living room is off. Six devices.' });
    expect(r.cases[0]!.trace.turns[0]!.spans.filter((s) => s.kind === 'plan')).toHaveLength(2);
    expect(Object.keys(cassette.entries).length).toBe(model.calls);
  });

  it('replays with identical findings twice, no model involved', async () => {
    const a = await runSuite(await llmSuite(), { url: served.url, orchestrator: 'replay', provider: new ReplayProvider(cassette) });
    const b = await runSuite(await llmSuite(), { url: served.url, orchestrator: 'replay', provider: new ReplayProvider(cassette) });
    expect(findings(a)).toEqual(findings(b));
    expect(a.cases.map((c) => c.trace.turns.at(-1)!.spoken)).toEqual(b.cases.map((c) => c.trace.turns.at(-1)!.spoken));
    const plan = a.cases[0]!.trace.turns[0]!.spans.find((s) => s.kind === 'plan')!;
    expect(plan.attrs).toEqual({ recorded: true });
  });

  it('fails hard when the tool list changed since recording', async () => {
    const flawed = await startSmartHome(0, false);
    try {
      await expect(runSuite(await llmSuite(), { url: flawed.url, orchestrator: 'replay', provider: new ReplayProvider(cassette), only: ['living-room-off'] })).rejects.toThrow(/tool list differs/);
    } finally {
      await flawed.close();
    }
  }, 30_000);

  it('fails hard, naming the message, when the server answers differently than recorded', async () => {
    // A recording in which the server had said something else: the live reply no longer matches.
    const tampered: Cassette = { ...cassette, entries: {} };
    for (const e of Object.values(cassette.entries)) {
      const request = structuredClone(e.request);
      for (const m of request.messages) for (const c of m.content) if (c.type === 'tool_result') c.text = `${c.text} (then)`;
      tampered.entries[hashRequest(request)] = { ...e, request };
    }
    const run = runSuite(await llmSuite(), { url: served.url, orchestrator: 'replay', provider: new ReplayProvider(tampered), only: ['living-room-off'] });
    await expect(run).rejects.toBeInstanceOf(ReplayMismatch);
    await expect(runSuite(await llmSuite(), { url: served.url, orchestrator: 'replay', provider: new ReplayProvider(tampered), only: ['living-room-off'] })).rejects.toThrow(/message 2 differs/);
  });
});
