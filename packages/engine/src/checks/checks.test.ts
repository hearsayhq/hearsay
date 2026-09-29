/** Unit fixtures on hand-built turns: no network. */
import { describe, expect, it } from 'vitest';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { CHECKS } from '../catalog';
import { SuiteSchema } from '../suite';
import type { Trace, Turn } from '../trace';
import { IMPLEMENTED } from './index';
import { latencyFirstAudio } from './latency';
import { speakLength, speakNoStructuredDump } from './speak';

const suite = SuiteSchema.parse({ suite: 'unit', server: { url: 'http://localhost:1/mcp' }, cases: [{ id: 'c', say: 'x', expect: { noTool: true } }] });
const turn = (spoken: string, toolMs = 5): Turn => ({
  id: 'c#1', utterance: 'x', heard: 'x', toolCalls: [], elicitations: [], spoken, toolListRevision: 0,
  spans: [
    { kind: 'asr', name: 'asr', startMs: 0, endMs: 300, modeled: true },
    { kind: 'tool', name: 't', startMs: 300, endMs: 300 + toolMs },
    { kind: 'speak', name: 'speak', startMs: 300 + toolMs, endMs: 500 + toolMs, modeled: true },
  ],
});
const trace = { orchestrator: 'scripted', variant: 'clean' } as Trace;
const tools = [{ name: 'timer_start', description: 'Use when the person asks to set or start a timer for the kitchen.', inputSchema: { type: 'object' } }] as Tool[];
const ctx = (t: Turn) => ({ suite, case: suite.cases[0]!, trace, turns: [t], tools });
const sev = (fs: Array<{ checkId: string; severity: string }>) => fs.map((f) => `${f.checkId}:${f.severity}`);

describe('speak.no_structured_dump', () => {
  it.each([
    ['{"devices":[{"id":1}]}', 'JSON'],
    ['| room | state |\n|---|---|', 'markdown'],
    ['See https://example.com', 'URL'],
    ['Order 123e4567-e89b-12d3-a456-426614174000 placed', 'UUID'],
    ['Added sku-milk to the cart', 'id'],
    ['Customer c-8841 updated', 'id'],
    ['I called timer_start for you', 'tool name / snake_case'],
  ])('fires on %s (%s)', (spoken) => expect(sev(speakNoStructuredDump.run(ctx(turn(spoken))))).toEqual(['speak.no_structured_dump:error']));

  it('fires on a tool description read aloud', () => {
    const f = speakNoStructuredDump.run(ctx(turn('Sure. Use when the person asks to set or start a timer for the kitchen.')));
    expect(f.map((x) => x.source.kind)).toEqual(['hearsay']);
  });

  it.each(['Pasta timer set for fifteen minutes.', "That's a well-known user-friendly recipe.", 'You have two timers, egg and pasta. Which one should I cancel?'])('passes %s', (spoken) =>
    expect(speakNoStructuredDump.run(ctx(turn(spoken)))).toEqual([]));
});

describe('speak.length', () => {
  it('errors over 400 characters (Amazon) and warns over the 280 budget (Hearsay)', () => {
    expect(sev(speakLength.run(ctx(turn('a'.repeat(401)))))).toEqual(['speak.length:error']);
    expect(sev(speakLength.run(ctx(turn('a'.repeat(300)))))).toEqual(['speak.length:warn']);
    expect(speakLength.run(ctx(turn('a'.repeat(280))))).toEqual([]);
  });
  it('lets the suite budget move only the Hearsay threshold (D-011)', () => {
    const loose = SuiteSchema.parse({ ...suite, budget: { spokenChars: 1000 } });
    expect(sev(speakLength.run({ ...ctx(turn('a'.repeat(401))), suite: loose }))).toEqual(['speak.length:error']);
  });
});

describe('latency.first_audio', () => {
  it('warns when modeled first audio exceeds the budget and says it is a lower bound', () => {
    const [f] = latencyFirstAudio.run(ctx(turn('ok', 1100)));
    expect(f).toMatchObject({ severity: 'warn', evidence: { totalMs: 1600, lowerBound: true } });
  });
  it('passes a fast turn', () => expect(latencyFirstAudio.run(ctx(turn('ok', 40)))).toEqual([]));
});

describe('registry', () => {
  it('implements exactly the checks the catalog marks implemented', () =>
    expect([...IMPLEMENTED].sort()).toEqual(CHECKS.filter((c) => c.status === 'implemented').map((c) => c.id).sort()));
});
