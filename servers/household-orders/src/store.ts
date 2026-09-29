/** Per-person state: mandate, cart, orders. Keyed by principal (D-009), or by session in flawed mode. */
import type { Mandate } from '@hearsayhq/mandate';

export interface Line {
  sku: string;
  quantity?: number;
  amountMinor: number;
  /** The mandate version this line was authorized under (D-009). */
  version: number;
}

export interface Account {
  mandate?: Mandate;
  cart: Line[];
  orders: Array<{ lines: Line[]; totalMinor: number; at: number }>;
}

export class Store {
  private accounts = new Map<string, Account>();
  get(key: string): Account {
    let a = this.accounts.get(key);
    if (!a) this.accounts.set(key, (a = { cart: [], orders: [] }));
    return a;
  }
}

export const cartTotal = (a: Account) => a.cart.reduce((n, l) => n + l.amountMinor, 0);
