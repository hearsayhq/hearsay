/**
 * Kitchen reference server (port 4101). Spec: servers/kitchen/README.md.
 * Milestone M1 (docs/07). MCP Streamable HTTP at http://localhost:4101/mcp, protocol 2025-11-25.
 * Green by default; HEARSAY_FIXED=0 is the flawed build for the agent-loop experiment (docs/15),
 * HEARSAY_FIXED=v2 the second experiment's build with subtler defects (docs/15 §v2).
 */
import { serveMcp, type Served } from '@hearsayhq/kit';
import { createFlawedKitchenServer } from './flawed';
import { createKitchenServerV2 } from './flawed-v2';
import { createKitchenServer } from './server';
import { TimerStore } from './timers';

type Build = boolean | 'v2';
const buildFromEnv = (): Build => (process.env.HEARSAY_FIXED === 'v2' ? 'v2' : process.env.HEARSAY_FIXED === '0');

export async function startKitchen(port = Number(process.env.PORT ?? 4101), flawed: Build = buildFromEnv()): Promise<Served> {
  const store = new TimerStore();
  const create = flawed === 'v2' ? createKitchenServerV2 : flawed ? createFlawedKitchenServer : createKitchenServer;
  return serveMcp({ port, create: (ctx) => create(store, ctx) });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const flawed = buildFromEnv();
  const served = await startKitchen(undefined, flawed);
  console.error(`[kitchen] ${flawed === 'v2' ? 'v2' : flawed ? 'flawed' : 'green'} on ${served.url}`);
  const stop = () => void served.close().then(() => process.exit(0));
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}
