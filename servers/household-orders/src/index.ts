/**
 * Household Orders reference server (port 4103). Spec: servers/household-orders/README.md.
 * Milestone M4 (docs/07). HEARSAY_FIXED=0 runs the flawed build (flawed.ts; fixture only).
 */
import { serveMcp, VerbalTokens, type Served } from '@hearsayhq/kit';
import { createFlawedHouseholdServer } from './flawed';
import { createHouseholdServer, tokenTtl, type Shared } from './server';
import { Store } from './store';

export async function startHousehold(port = Number(process.env.PORT ?? 4103), flawed = process.env.HEARSAY_FIXED === '0', ttlSeconds = tokenTtl()): Promise<Served> {
  const shared: Shared = { store: new Store(), tokens: new VerbalTokens({ ttlSeconds }), pending: new Map(), now: Date.now };
  return serveMcp({ port, create: (ctx) => (flawed ? createFlawedHouseholdServer(shared, ctx) : createHouseholdServer(shared, ctx)) });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const flawed = process.env.HEARSAY_FIXED === '0';
  const served = await startHousehold(undefined, flawed);
  console.error(`[household-orders] ${flawed ? 'flawed' : 'fixed'} on ${served.url}`);
  const stop = () => void served.close().then(() => process.exit(0));
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}
