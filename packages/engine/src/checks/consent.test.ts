/** Unit fixtures for the consent thresholds no reference server trips (no network). */
import { describe, expect, it } from 'vitest';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SuiteSchema } from '../suite';
import type { Trace, Turn } from '../trace';
import { consentOverConfirmation, consentPath } from './consent';

const suite = SuiteSchema.parse({ suite: 'u', server: { url: 'http://localhost:1/mcp' }, cases: [{ id: 'buy', say: 'buy it', expect: { tool: 'buy', confirm: 'required' } }, { id: 'look', say: 'what is in my cart', expect: { tool: 'cart_view' } }] });
const verbalTurn: Turn = {
  id: 't', utterance: 'buy it', heard: 'buy it', spans: [], elicitations: [], spoken: 'Buy two apples for one dollar?', toolListRevision: 0,
  toolCalls: [{ tool: 'buy', args: {}, latencyMs: 1, result: { isError: false, text: 'Buy two apples for one dollar?', structuredContent: { confirmation: { token: 'x', question: 'Buy two apples for one dollar?', confirmTool: 'buy_confirm', expiresInSeconds: 60 } } } }],
};
const trace = (elicitation: boolean) => ({ variant: 'clean', orchestrator: 'scripted', client: { elicitation } }) as Trace;

describe('consent.path', () => {
  it('warns when the server confirms by voice although the client can elicit', () =>
    expect(consentPath.run({ suite, case: suite.cases[0]!, trace: trace(true), turns: [verbalTurn], tools: [] }).map((f) => [f.severity, f.source.kind])).toEqual([['warn', 'hearsay']]));
});

describe('consent.over_confirmation', () => {
  it('warns when a read-only tool asks for confirmation', () => {
    const turn: Turn = { ...verbalTurn, toolCalls: [{ tool: 'cart_view', args: {}, latencyMs: 1, result: { isError: false, text: 'Two apples.' }, elicitations: [{ message: 'Show your cart?', action: 'accept' }] }] };
    const tools = [{ name: 'cart_view', inputSchema: { type: 'object' }, annotations: { readOnlyHint: true } }] as Tool[];
    expect(consentOverConfirmation.run({ suite, case: suite.cases[1]!, trace: trace(true), turns: [turn], tools }).map((f) => [f.severity, f.source.kind])).toEqual([['warn', 'amazon-fr']]);
  });
});
