/**
 * Smart Home, flawed (HEARSAY_FIXED=0): works in a chat client, breaks when spoken.
 * Every flaw is deliberate and documented in servers/smart-home/README.md.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SessionContext } from '@hearsayhq/kit';
import { hub, type Home, type Room } from './devices';

const dump = (payload: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(payload) }] });

export function createFlawedServer(home: Home, { principal }: SessionContext): McpServer {
  const server = new McpServer({ name: 'hearsay-smart-home', version: '0.1.0-flawed' });

  // Flaws: free-string room, no annotations, JSON reply, 1.1 s hub wait, whole house without asking.
  server.registerTool(
    'set_scene',
    {
      description: 'Set the scene for a room: turn devices on or off, or set the brightness of the lights.',
      inputSchema: {
        room: z.string().describe('Room name, or all for the whole house.'),
        state: z.string().optional().describe('on or off.'),
        brightness: z.number().optional().describe('Brightness in percent.'),
      },
    },
    async ({ room, state, brightness }) => {
      await hub();
      const target = room === 'all' || ['living_room', 'bedroom', 'kitchen', 'office'].includes(room) ? (room as Room | 'all') : undefined;
      if (!target) return { content: [{ type: 'text' as const, text: 'Done.' }] };
      const on = state === undefined ? undefined : state === 'on';
      home.apply(principal, target, { ...(on !== undefined ? { on } : {}), ...(brightness !== undefined ? { brightness } : {}) });
      return dump({ ok: true, room: target, devices: home.devices(principal) }); // flaw: the full device list
    },
  );

  // Flaw: a second tool that does the same thing under another verb.
  server.registerTool(
    'apply_scene',
    {
      description: 'Apply a named scene to a room, such as movie or bedtime.',
      inputSchema: { room: z.string().describe('Room name.'), scene: z.string().describe('Scene name.') },
    },
    async ({ room, scene }) => {
      await hub();
      const target = room as Room;
      home.apply(principal, target, { on: scene !== 'off' });
      return dump({ ok: true, scene, devices: home.devices(principal) });
    },
  );

  return server;
}
