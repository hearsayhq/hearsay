/**
 * Smart Home reference server (port 4102). Spec: servers/smart-home/README.md.
 * Milestone M2 (docs/07). HEARSAY_FIXED=0 (default) is flawed, HEARSAY_FIXED=1 is the kit applied,
 * HEARSAY_FIXED=v2 the second experiment's build with subtler defects (docs/15 §v2).
 */
import { serveMcp, type Served } from '@hearsayhq/kit';
import { Home } from './devices';
import { createFixedServer } from './fixed';
import { createFlawedServer } from './flawed';
import { createSmartHomeServerV2 } from './flawed-v2';

type Build = boolean | 'v2';
const buildFromEnv = (): Build => (process.env.HEARSAY_FIXED === 'v2' ? 'v2' : process.env.HEARSAY_FIXED === '1');

/** `fixed`: true for the kit applied, false for the flawed build, 'v2' for the second experiment's. */
export async function startSmartHome(port = Number(process.env.PORT ?? 4102), fixed: Build = buildFromEnv()): Promise<Served> {
  const home = new Home();
  const create = fixed === 'v2' ? createSmartHomeServerV2 : fixed ? createFixedServer : createFlawedServer;
  return serveMcp({ port, create: (ctx) => create(home, ctx) });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fixed = buildFromEnv();
  const served = await startSmartHome(undefined, fixed);
  console.error(`[smart-home] ${fixed === 'v2' ? 'v2' : fixed ? 'fixed' : 'flawed'} on ${served.url}`);
  const stop = () => void served.close().then(() => process.exit(0));
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}
