/**
 * Household Orders reference server (port 4103). Spec: servers/household-orders/README.md.
 * Milestone M4 (docs/07). HEARSAY_FIXED=0 runs the flawed build (flawed.ts; fixture only),
 * HEARSAY_FIXED=v2 the second experiment's build with subtler defects (docs/15 §v2).
 */
import { serveMcp, VerbalTokens, type Served } from '@hearsayhq/kit';
import { createFlawedHouseholdServer } from './flawed';
import { createHouseholdServerV2 } from './flawed-v2';
import { createHouseholdServer, tokenTtl, type Shared } from './server';
import { Store } from './store';

type Build = boolean | 'v2';
const buildFromEnv = (): Build => (process.env.HEARSAY_FIXED === 'v2' ? 'v2' : process.env.HEARSAY_FIXED === '0');

export async function startHousehold(port = Number(process.env.PORT ?? 4103), flawed: Build = buildFromEnv(), ttlSeconds = tokenTtl()): Promise<Served> {
  const shared: Shared = { store: new Store(), tokens: new VerbalTokens({ ttlSeconds }), pending: new Map(), now: Date.now };
  const create = flawed === 'v2' ? createHouseholdServerV2 : flawed ? createFlawedHouseholdServer : createHouseholdServer;
  return serveMcp({ port, create: (ctx) => create(shared, ctx) });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const flawed = buildFromEnv();
  const served = await startHousehold(undefined, flawed);
  console.error(`[household-orders] ${flawed === 'v2' ? 'v2' : flawed ? 'flawed' : 'fixed'} on ${served.url}`);
  const stop = () => void served.close().then(() => process.exit(0));
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}
