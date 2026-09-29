import { describe, expect, it } from 'vitest';
import type { TurnContext } from '../orchestrator';
import { SuiteSchema } from '../suite';
import { nearestCase, nearestCasePlanner } from './planner';

const suite = SuiteSchema.parse({
  suite: 'kitchen',
  server: { url: 'http://localhost:4101/mcp' },
  cases: [
    { id: 'pasta', say: 'set a pasta timer for fifteen minutes', expect: { tool: 'timer_start', args: { minutes: 15, label: 'pasta' } } },
    { id: 'list', say: 'how long is left on my timers', expect: { tool: 'timer_list' } },
  ],
});

const ctx = (heard: string, calls: unknown[]): TurnContext => ({
  heard,
  tools: [],
  history: [],
  callTool: async (tool, args) => (calls.push({ tool, args }), { isError: false, text: 'ok' }),
});

describe('nearest-case planner (D-023)', () => {
  it('matches the closest case by shared words', () => {
    expect(nearestCase(suite, 'how much time is left on my timers')?.case.id).toBe('list');
    expect(nearestCase(suite, 'play some jazz')).toBeUndefined();
  });

  it('carries the typed words into the arguments, like the literal planner', async () => {
    const calls: unknown[] = [];
    await nearestCasePlanner(suite).respond(ctx('set a pasta timer for twenty minutes', calls));
    expect(calls).toEqual([{ tool: 'timer_start', args: { minutes: 20, label: 'pasta' } }]);
  });

  it('calls nothing and says what it can do when nothing matches', async () => {
    const calls: unknown[] = [];
    const r = await nearestCasePlanner(suite).respond(ctx('play some jazz', calls));
    expect(calls).toEqual([]);
    expect(r.spoken).toMatch(/set a pasta timer/);
  });
});
