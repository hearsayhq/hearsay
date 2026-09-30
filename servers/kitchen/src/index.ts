/**
 * Kitchen reference server (port 4101). Spec: servers/kitchen/README.md.
 * Milestone M1 (docs/07). MCP Streamable HTTP at http://localhost:4101/mcp, protocol 2025-11-25.
 * Green by default; HEARSAY_FIXED=0 is the flawed build for the agent-loop experiment (docs/15).
 */
import { serveMcp, type Served } from '@hearsayhq/kit';
import { createFlawedKitchenServer } from './flawed';
import { createKitchenServer } from './server';
import { TimerStore } from './timers';

export async function startKitchen(port = Number(process.env.PORT ?? 4101), flawed = process.env.HEARSAY_FIXED === '0'): Promise<Served> {
  const store = new TimerStore();
  return serveMcp({ port, create: (ctx) => (flawed ? createFlawedKitchenServer(store, ctx) : createKitchenServer(store, ctx)) });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const flawed = process.env.HEARSAY_FIXED === '0';
  const served = await startKitchen(undefined, flawed);
  console.error(`[kitchen] ${flawed ? 'flawed' : 'green'} on ${served.url}`);
  const stop = () => void served.close().then(() => process.exit(0));
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}
