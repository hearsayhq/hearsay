/**
 * Smart Home reference server (port 4102). Spec: servers/smart-home/README.md.
 * Milestone M2 (docs/07). HEARSAY_FIXED=0 (default) is flawed, HEARSAY_FIXED=1 is the kit applied.
 */
import { serveMcp, type Served } from '@hearsayhq/kit';
import { Home } from './devices';
import { createFixedServer } from './fixed';
import { createFlawedServer } from './flawed';

export async function startSmartHome(port = Number(process.env.PORT ?? 4102), fixed = process.env.HEARSAY_FIXED === '1'): Promise<Served> {
  const home = new Home();
  return serveMcp({ port, create: (ctx) => (fixed ? createFixedServer(home, ctx) : createFlawedServer(home, ctx)) });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fixed = process.env.HEARSAY_FIXED === '1';
  const served = await startSmartHome(undefined, fixed);
  console.error(`[smart-home] ${fixed ? 'fixed' : 'flawed'} on ${served.url}`);
  const stop = () => void served.close().then(() => process.exit(0));
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}
