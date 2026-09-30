/** coverage.* fixtures (FR-067): each check fires on a suite built with the gap, and stays quiet once the gap is closed. */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { describe, expect, it } from 'vitest';
import type { CaseResult } from '../report';
import { SuiteSchema, type Suite } from '../suite';
import { coverageDecline, coverageLimits, coverageTools, coverageValues } from './coverage';
import type { SuiteCheckContext } from './types';

const tool = (name: string, properties: Record<string, unknown> = {}, readOnly = false): Tool =>
  ({ name, description: `Use when testing ${name}.`, inputSchema: { type: 'object', properties }, annotations: { readOnlyHint: readOnly } }) as Tool;

const suite = (cases: unknown[], checks: string[] = []): Suite =>
  SuiteSchema.parse({ suite: 'fixture', server: { url: 'http://localhost:1/mcp' }, orchestrator: 'scripted', checks, cases });

const result = (calls: Array<{ tool: string; args?: Record<string, unknown>; errorCode?: string; asked?: 'accept' | 'decline' }>): CaseResult =>
  ({
    caseId: 'x',
    variant: 'clean',
    verdict: 'pass',
    findings: [],
    trace: {
      turns: [
        {
          toolCalls: calls.map((c) => ({
            tool: c.tool,
            args: c.args ?? {},
            latencyMs: 1,
            result: { isError: !!c.errorCode, text: '', ...(c.errorCode ? { errorCode: c.errorCode } : {}) },
            ...(c.asked ? { elicitations: [{ message: 'Sure?', action: c.asked }] } : {}),
          })),
        },
      ],
    },
  }) as unknown as CaseResult;

const ctx = (s: Suite, tools: Tool[], results: CaseResult[]): SuiteCheckContext => ({ suite: s, cases: s.cases, tools, results });
const messages = (fs: Array<{ message: string }>) => fs.map((f) => f.message);

describe('coverage.tools', () => {
  const tools = [tool('lights_set'), tool('lights_status', {}, true)];
  it('fires for a tool no case reaches', () =>
    expect(messages(coverageTools.run(ctx(suite([{ id: 'a', say: 'lights off', expect: { tool: 'lights_set' } }]), tools, [])))).toEqual(['lights_status has no case']));
  it('is quiet when a trace reaches it', () =>
    expect(coverageTools.run(ctx(suite([{ id: 'a', say: 'lights off', expect: { tool: 'lights_set' } }]), tools, [result([{ tool: 'lights_status' }])]))).toEqual([]));
});

describe('coverage.values', () => {
  const tools = [tool('scene', { room: { type: 'string', enum: ['kitchen', 'office', 'all'] }, level: { type: 'integer', minimum: 0, maximum: 100 } })];
  const s = suite([{ id: 'a', say: 'dim the kitchen', expect: { tool: 'scene', args: { room: 'kitchen', level: 30 } } }]);
  it('names enum values no case uses and bounds no case crosses', () =>
    expect(messages(coverageValues.run(ctx(s, tools, [])))).toEqual(['scene.room: office, all never used', 'scene.level: no case tries a value outside 0–100']));
  it('is quiet when every value is used and a bound is crossed', () =>
    expect(coverageValues.run(ctx(s, tools, [result([{ tool: 'scene', args: { room: 'office' } }, { tool: 'scene', args: { room: 'all', level: 130 } }])]))).toEqual([]));
});

describe('coverage.decline', () => {
  const tools = [tool('order_place')];
  it('fires when a tool asks and nobody says no', () =>
    expect(messages(coverageDecline.run(ctx(suite([{ id: 'a', say: 'place it', expect: { tool: 'order_place', confirm: 'required' } }]), tools, [result([{ tool: 'order_place', asked: 'accept' }])])))).toEqual([
      'order_place asks for confirmation, but no case says no',
    ]));
  it('is quiet with a declining case', () =>
    expect(
      coverageDecline.run(ctx(suite([{ id: 'a', say: 'place it', expect: { tool: 'order_place', confirm: 'required' } }, { id: 'b', say: 'place it', human: { answer: 'decline' }, expect: { tool: 'order_place', confirm: 'required' } }]), tools, [])),
    ).toEqual([]));
});

describe('coverage.limits', () => {
  const tools = [tool('cart_add', { amountUsd: { type: 'number', minimum: 1, maximum: 500 } }), tool('mandate_grant', { totalLimitUsd: { type: 'number' } }), tool('cart_view', { count: { type: 'integer' } }, true)];
  const s = (checks: string[]) => suite([{ id: 'a', say: 'add fruit', expect: { tool: 'cart_add', args: { amountUsd: 5 } } }], checks);
  it('fires for an amount tool never refused over the limit, under the mandate profile', () =>
    expect(messages(coverageLimits.run(ctx(s(['mandate.version_race']), tools, [])))).toEqual(['cart_add takes an amount, but no case goes over the limit']));
  it('is quiet without the mandate profile', () => expect(coverageLimits.run(ctx(s([]), tools, []))).toEqual([]));
  it('is quiet once a run was refused with LIMIT_EXCEEDED', () =>
    expect(coverageLimits.run(ctx(s(['mandate.version_race']), tools, [result([{ tool: 'cart_add', args: { amountUsd: 900 }, errorCode: 'LIMIT_EXCEEDED' }])]))).toEqual([]));
});
