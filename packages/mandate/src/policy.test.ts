import { describe, expect, it } from 'vitest';
import { authorize, MandateError, type Mandate } from './index';

const T0 = 1_000_000;
const base = (over: Partial<Mandate> = {}): Mandate => ({
  id: 'm1',
  version: 1,
  status: 'ACTIVE',
  tools: ['orders_stage_cart'],
  resourceIds: ['sku-milk', 'sku-eggs'],
  limits: { currency: 'USD', perCallMinor: 3000, totalMinor: 5000 },
  spentMinor: 0,
  createdAt: T0,
  expiresAt: T0 + 60_000,
  ...over,
});

const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as MandateError).code;
  }
  return 'OK';
};

describe('authorize (ordering carried over from webMCP policy.ts)', () => {
  const call = { tool: 'orders_stage_cart', mandateVersion: 1, resourceId: 'sku-milk', amountMinor: 1500 };

  it('allows an in-scope call', () => expect(code(() => authorize(base(), call, T0))).toBe('OK'));
  it('refuses without a mandate', () => expect(code(() => authorize(undefined, call, T0))).toBe('NO_ACTIVE_MANDATE'));
  it('expires by the clock', () => expect(code(() => authorize(base(), call, T0 + 60_000))).toBe('MANDATE_EXPIRED'));
  it('reports a version race before scope', () =>
    expect(code(() => authorize(base({ version: 2 }), { ...call, tool: 'other' }, T0))).toBe('POLICY_CHANGED'));
  it('checks the current mandate when the caller names no version (D-009)', () => {
    const { mandateVersion: _, ...unversioned } = call;
    expect(code(() => authorize(base({ version: 2 }), unversioned, T0))).toBe('OK');
    expect(code(() => authorize(base({ version: 2 }), { ...unversioned, resourceId: 'sku-wine' }, T0))).toBe('OUT_OF_SCOPE');
  });
  it('refuses tools the mandate never named', () =>
    expect(code(() => authorize(base(), { ...call, tool: 'orders_place' }, T0))).toBe('OUT_OF_SCOPE'));
  it('refuses resources the mandate never named', () =>
    expect(code(() => authorize(base(), { ...call, resourceId: 'sku-wine' }, T0))).toBe('OUT_OF_SCOPE'));
  it('holds the per-call limit when "fifteen" is heard as "fifty"', () =>
    expect(code(() => authorize(base(), { ...call, amountMinor: 5000 }, T0))).toBe('LIMIT_EXCEEDED'));
  it('holds the cumulative limit', () =>
    expect(code(() => authorize(base({ spentMinor: 4000 }), call, T0))).toBe('LIMIT_EXCEEDED'));
});
