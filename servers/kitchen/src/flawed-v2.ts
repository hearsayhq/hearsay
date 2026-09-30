/**
 * Kitchen, second experiment build (docs/15 §v2, servers/kitchen/README.md §v2). Each defect
 * passes a one-sentence smoke test; the happy path sounds right.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { count, list, looseInt, refuse, speak, words, type SessionContext } from '@hearsayhq/kit';
import { RECIPE } from './recipe';
import type { TimerStore } from './timers';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const MINUTES = looseInt(1, 240, 'Duration in whole minutes, 1 to 240.');
const STEP = looseInt(1, RECIPE.steps.length, `Step number, 1 to ${RECIPE.steps.length}.`);

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function createKitchenServerV2(store: TimerStore, { principal }: SessionContext): McpServer {
  const server = new McpServer({ name: 'hearsay-kitchen', version: '0.1.0' });

  server.registerTool(
    'timer_start',
    {
      title: 'Start a kitchen timer',
      description: 'Use when the person asks to set or start a timer, for example "set a pasta timer for fifteen minutes". Starting a timer with an existing label restarts it.',
      inputSchema: {
        minutes: MINUTES.schema,
        label: z.string().min(1).max(40).optional().describe('What the timer is for, such as pasta or egg. Defaults to "timer".'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ minutes: raw, label }) => {
      const minutes = MINUTES.parse(raw);
      if (minutes === undefined) return refuse('How many minutes should the timer run? Say a number from one to two hundred forty.', 'INVALID_MINUTES');
      const name = (label ?? 'timer').trim().toLowerCase();
      store.start(principal, name, minutes);
      const what = name === 'timer' ? 'Timer' : `${cap(name)} timer`;
      if (minutes >= 30) return speak(`${what} set.`, { label: name, minutes });
      return speak(`${what} set for ${count(minutes, 'minute')}.`, { label: name, minutes });
    },
  );

  server.registerTool(
    'timer_list',
    {
      title: 'List running timers',
      description: 'Use when the person asks which timers are running or how long is left.',
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      const timers = store.list(principal);
      if (!timers.length) return speak('You have no timers running.', { timers: [] });
      const items = timers.map((t) => `${t.label} with ${count(t.minutesLeft, 'minute')} left`);
      const head = timers.length === 1 ? 'One timer' : `${cap(words(timers.length))} timers`;
      const spoken = items.length === 1 ? items[0] : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
      return speak(`${head}: ${spoken}.`, { timers });
    },
  );

  server.registerTool(
    'timer_cancel',
    {
      title: 'Cancel a timer',
      description: 'Use when the person asks to stop or cancel a timer. Name the timer by its label; with several timers and no label, the person is asked which one.',
      inputSchema: {
        label: z.string().min(1).max(40).optional().describe('Label of the timer to cancel, such as pasta.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ label }) => {
      const timers = store.list(principal);
      if (!timers.length) return refuse('You have no timers running. You can start one by saying set a timer.', 'NO_TIMERS');
      const names = timers.map((t) => t.label);
      const target = label?.trim().toLowerCase() ?? names[0]!;
      if (!store.cancel(principal, target))
        return refuse(`There's no ${target} timer. You have ${list(names)}. Which one should I cancel?`, 'NOT_FOUND', { labels: names });
      return speak(`${cap(target)} timer cancelled.`, { label: target });
    },
  );

  server.registerTool(
    'recipe_step',
    {
      title: 'Read a recipe step',
      description: `Use when the person asks for a step of the current recipe (${RECIPE.name}). Reading a step changes nothing.`,
      inputSchema: {
        number: STEP.schema,
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ number: raw }) => {
      const number = STEP.parse(raw);
      if (number === undefined) return refuse(`There is no step ${String(raw)} (NO_SUCH_STEP).`, 'NO_SUCH_STEP', { steps: RECIPE.steps.length });
      await pause(560);
      return speak(`Step ${words(number)} of ${words(RECIPE.steps.length)}: ${RECIPE.steps[number - 1]}`, { step: number });
    },
  );

  return server;
}
