/**
 * Kitchen, flawed (HEARSAY_FIXED=0): the timers work in a chat client and break when spoken.
 * Built for the agent-loop experiment (docs/15); every flaw is documented in
 * servers/kitchen/README.md. The default build stays the green reference.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SessionContext } from '@hearsayhq/kit';
import { RECIPE } from './recipe';
import type { TimerStore } from './timers';

const text = (t: string) => ({ content: [{ type: 'text' as const, text: t }] });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function createFlawedKitchenServer(store: TimerStore, { principal }: SessionContext): McpServer {
  const server = new McpServer({ name: 'hearsay-kitchen', version: '0.1.0-flawed' });

  server.registerTool(
    'timer_start',
    {
      description: 'Start a timer.',
      inputSchema: {
        minutes: z.number().int().min(1).max(240).describe('Minutes.'),
        label: z.string().optional().describe('Label.'),
      },
    },
    async ({ minutes, label }) => {
      store.start(principal, (label ?? 'timer').toLowerCase(), minutes);
      return text('Timer started.');
    },
  );

  server.registerTool(
    'timer_list',
    { description: 'List timers.', inputSchema: {}, annotations: { readOnlyHint: true } },
    async () => text(JSON.stringify({ timers: store.list(principal) })),
  );

  server.registerTool(
    'timer_cancel',
    {
      description: 'Cancel a timer.',
      inputSchema: { label: z.string().optional().describe('Label.') },
    },
    async ({ label }) => {
      const timers = store.list(principal);
      const target = label?.toLowerCase() ?? timers[0]?.label;
      if (!target || !store.cancel(principal, target)) return { ...text(`Error: no timer ${target ?? ''}`), isError: true };
      return text('Cancelled.');
    },
  );

  server.registerTool(
    'timer_stop',
    {
      description: 'Stop a timer.',
      inputSchema: { label: z.string().optional().describe('Label.') },
    },
    async ({ label }) => text(store.cancel(principal, (label ?? '').toLowerCase()) ? 'Stopped.' : 'Not found.'),
  );

  server.registerTool(
    'recipe_step',
    {
      description: 'Get a recipe step.',
      inputSchema: { number: z.number().int().min(1).max(RECIPE.steps.length).describe('Step.') },
      annotations: { readOnlyHint: true },
    },
    async ({ number }) => {
      await sleep(700); // the recipe service
      return text(RECIPE.steps[number - 1]!);
    },
  );

  return server;
}
