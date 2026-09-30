/**
 * Smart Home, second experiment build (docs/15 §v2, servers/smart-home/README.md §v2). Each
 * defect passes a one-sentence smoke test; the happy path sounds right.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { confirm, count, looseEnum, refuse, speak, words, type SessionContext } from '@hearsayhq/kit';
import { ROOMS, hub, type Home } from './devices';

const room = looseEnum([...ROOMS, 'all'] as const, {
  living_room: ['living', 'family room'],
  bedroom: ['bed room', 'master bedroom'],
  all: ['whole house', 'house', 'everything', 'everywhere', 'home'],
}, 'Which room: living room, bedroom, kitchen or office, or all for the whole house.');

const spokenRoom = (r: string) => (r === 'all' ? 'The whole house' : r.replace('_', ' ').replace(/^./, (c) => c.toUpperCase()));

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function createSmartHomeServerV2(home: Home, { principal }: SessionContext): McpServer {
  const server = new McpServer({ name: 'hearsay-smart-home', version: '0.1.0' });

  server.registerTool(
    'set_scene',
    {
      title: 'Set a room scene',
      description: 'Use when the person asks to turn a room or the whole house on or off, or to dim or brighten the lights. The whole house needs their confirmation.',
      inputSchema: {
        room: room.schema,
        state: z.enum(['on', 'off']).optional().describe('Turn everything in the room on or off.'),
        brightness: z.number().int().min(0).max(100).optional().describe('Light brightness in percent, 0 to 100.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ room: raw, state, brightness }) => {
      const target = room.normalize(raw);
      if (!target)
        return refuse(`Unknown room ${raw.replace(/[_-]+/g, ' ')} (UNKNOWN_ROOM).`, 'UNKNOWN_ROOM');
      if (state === undefined && brightness === undefined)
        return refuse('Should I turn it on or off, or set the lights to a brightness?', 'MISSING_ACTION');

      const n = home.devices(principal).filter((d) => target === 'all' || d.room === target).length;
      if (target === 'all' && brightness === undefined) {
        const answer = await confirm(server, `Turn ${state} everything in the whole house?`);
        if (answer === 'unavailable') return refuse("I can't ask you to confirm here, so I left everything as it was. You can change one room at a time.", 'CONFIRMATION_UNAVAILABLE');
        if (answer !== 'accepted') return speak('Okay, I left everything as it was.', { committed: false });
      }

      home.apply(principal, target, { ...(state ? { on: state === 'on' } : {}), ...(brightness !== undefined ? { brightness } : {}) });
      if (target === 'all') await pause(600);
      void hub();
      const where = spokenRoom(target);
      if (brightness !== undefined) return speak(`${where} ${brightness === 0 ? 'lights are off' : brightness < 20 ? 'dimmed' : `dimmed to ${words(brightness)} percent`}.`, { room: target, brightness });
      return speak(`${target === 'all' ? 'Okay, the whole house' : where} is ${state}. ${count(n, 'device').replace(/^./, (c) => c.toUpperCase())}.`, { room: target, state, devices: n });
    },
  );

  return server;
}
