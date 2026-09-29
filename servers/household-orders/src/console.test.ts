/**
 * M5 (FR-040/041): the console plays turns against a live server, and a person answers the
 * elicitation. The time they take is theirs, not the server's (latency.tool).
 */
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { Served } from '@hearsayhq/kit';
import { ConsoleSession, loadSuite, type ConsoleEvent } from '@hearsayhq/engine';
import { startHousehold } from './index';

let served: Served | undefined;
let cs: ConsoleSession | undefined;
afterEach(async () => {
  await cs?.close();
  await served?.close();
  cs = served = undefined;
});

const suitePath = join(import.meta.dirname, '../../../suites/household-orders.yaml');

async function open(answer: (n: number) => 'accept' | 'decline') {
  served = await startHousehold(0, false, 60);
  cs = await ConsoleSession.open(served.url, await loadSuite(suitePath));
  const events: ConsoleEvent[] = [];
  let asked = 0;
  cs.on('event', (e: ConsoleEvent) => {
    events.push(e);
    const d = e.data as { id: string; message: string };
    // A person reads the question for a moment, then answers.
    if (e.type === 'elicitation') setTimeout(() => cs!.answer(d.id, answer(++asked)), 700);
  });
  return events;
}

describe('console session', () => {
  it('a person grants the mandate and places the order; their wait is not server latency', async () => {
    const events = await open(() => 'accept');
    const grant = await cs!.say('you can reorder groceries up to fifty dollars today, nothing else');
    expect(grant.match?.case.id).toBe('grant-mandate');
    expect(grant.turn.elicitations).toEqual([expect.objectContaining({ action: 'accept' })]);
    expect(grant.findings.filter((f) => f.checkId === 'latency.tool')).toEqual([]);
    await cs!.say('add three cartons of milk');
    const order = await cs!.say('okay, place the order');
    expect(order.turn.elicitations[0]?.message).toMatch(/milk/i);
    expect(order.turn.spoken).toMatch(/placed/);
    expect(events.filter((e) => e.type === 'elicitation')).toHaveLength(2);
  }, 20_000);

  it('a no in the browser holds the order', async () => {
    await open((n) => (n === 1 ? 'accept' : 'decline'));
    await cs!.say('you can reorder groceries up to fifty dollars today, nothing else');
    await cs!.say('add two cartons of milk');
    const order = await cs!.say('okay, place the order');
    expect(order.turn.spoken).toMatch(/not/i);
  }, 20_000);
});
