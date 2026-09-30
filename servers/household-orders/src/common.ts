/** What both Household Orders builds share: state, the catalog enum and spoken phrases. */
import { count, list, looseEnum, money, words, type VerbalTokens } from '@hearsayhq/kit';
import { CATALOG, bySku } from './catalog';
import type { Line, Store } from './store';

export interface Shared {
  store: Store;
  tokens: VerbalTokens;
  /** Token → what the person was asked to confirm. */
  pending: Map<string, { action: 'grant' | 'checkout'; key: string; proposal?: Proposal }>;
  now: () => number;
}

export interface Proposal {
  resourceIds: string[];
  totalMinor: number;
  perCallMinor?: number;
  durationSeconds: number;
}

export const SCOPED_TOOLS = ['orders_stage_cart', 'orders_request_checkout'];
export const sku = looseEnum(
  CATALOG.map((i) => i.sku) as [string, ...string[]],
  Object.fromEntries(CATALOG.map((i) => [i.sku, i.synonyms])),
  'The item, such as milk, eggs, bread, fruit or oat milk.',
);

export const lineWords = (l: Line) => {
  const item = bySku.get(l.sku)!;
  if (l.quantity === undefined) return `${money(l.amountMinor)} of ${item.name}`;
  return item.unit ? `${count(l.quantity, item.unit === 'dozen' ? 'dozen' : item.unit).replace('dozens', 'dozen')} of ${item.name}` : `${words(l.quantity)} ${item.name}`;
};
export const durationWords = (s: number) => (s >= 12 * 3600 ? 'today' : s >= 3600 ? `the next ${count(Math.round(s / 3600), 'hour')}` : s >= 60 ? `the next ${count(Math.round(s / 60), 'minute')}` : `the next ${count(s, 'second')}`);
export const names = (ids: string[]) => list(ids.map((id) => bySku.get(id)?.name ?? id), { max: 5 });

export const tokenTtl = () => Math.min(Number(process.env.HEARSAY_TOKEN_TTL_S ?? 60), 60);
