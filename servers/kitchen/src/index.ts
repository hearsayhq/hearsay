/**
 * Kitchen reference server (port 4101). Spec: servers/kitchen/README.md.
 * Milestone M1 (docs/07). MCP Streamable HTTP at http://localhost:4101/mcp, protocol 2025-11-25.
 */
import { serveMcp, type Served } from '@hearsayhq/kit';
import { createKitchenServer } from './server';
import { TimerStore } from './timers';

export async function startKitchen(port = Number(process.env.PORT ?? 4101)): Promise<Served> {
  const store = new TimerStore();
  return serveMcp({ port, create: (ctx) => createKitchenServer(store, ctx) });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const served = await startKitchen();
  console.error(`[kitchen] listening on ${served.url}`);
  const stop = () => void served.close().then(() => process.exit(0));
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}
