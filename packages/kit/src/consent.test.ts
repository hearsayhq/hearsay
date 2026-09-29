import { describe, expect, it } from 'vitest';
import type { Mandate } from '@hearsayhq/mandate';
import { askVerbally, VerbalTokens, withMandate } from './index';

describe('VerbalTokens', () => {
  let t = 0;
  const tokens = () => new VerbalTokens({ now: () => t });
  const cart = { items: [{ sku: 'milk', qty: 2 }], amountMinor: 740 };

  it('redeems once, for the same person and the same cart', () => {
    t = 0;
    const v = tokens();
    const { token } = v.issue('ann', 'checkout', cart);
    expect(v.redeem('bob', token, cart)).toEqual({ ok: false, reason: 'unknown' });
    expect(v.redeem('ann', token, { ...cart, amountMinor: 5740 })).toEqual({ ok: false, reason: 'mismatch' });
    expect(v.redeem('ann', token, { amountMinor: 740, items: [{ qty: 2, sku: 'milk' }] })).toEqual({ ok: true, action: 'checkout' });
    expect(v.redeem('ann', token, cart)).toEqual({ ok: false, reason: 'used' });
  });
  it('expires', () => {
    t = 0;
    const v = tokens();
    const { token } = v.issue('ann', 'checkout', cart);
    t = 60_000;
    expect(v.redeem('ann', token, cart)).toEqual({ ok: false, reason: 'expired' });
  });
  it('is voided by a cart change', () => {
    const v = tokens();
    const { token } = v.issue('ann', 'checkout', cart);
    v.invalidate('ann');
    expect(v.redeem('ann', token, cart)).toMatchObject({ ok: false });
  });
  it('never lives longer than 60 s', () => expect(() => new VerbalTokens({ ttlSeconds: 300 })).toThrow(/60/));
  it('speaks the question and hands the token to the model', () =>
    expect(askVerbally('Place the order: two cartons of milk, seven dollars and forty cents?', { token: 't1', expiresInSeconds: 60 }, 'orders_confirm')).toMatchObject({
      content: [{ text: 'Place the order: two cartons of milk, seven dollars and forty cents?' }],
      structuredContent: { confirmation: { token: 't1', confirmTool: 'orders_confirm', expiresInSeconds: 60 } },
    }));
});

describe('withMandate', () => {
  const m: Mandate = { id: 'm', version: 1, status: 'ACTIVE', tools: ['orders_stage_cart'], resourceIds: ['sku-milk'], spentMinor: 0, createdAt: 0, expiresAt: 10_000, limits: { currency: 'USD', totalMinor: 5000 } };
  it('lets an in-scope call through', () => expect(withMandate(m, { tool: 'orders_stage_cart', resourceId: 'sku-milk', amountMinor: 740 }, 1)).toBeUndefined());
  it('turns a refusal into a spoken result with its code', () =>
    expect(withMandate(m, { tool: 'orders_stage_cart', resourceId: 'sku-milk', amountMinor: 5740 }, 1)).toMatchObject({ isError: true, structuredContent: { code: 'LIMIT_EXCEEDED' } }));
  it('refuses without a mandate', () => expect(withMandate(undefined, { tool: 'orders_stage_cart' }, 1)).toMatchObject({ structuredContent: { code: 'NO_ACTIVE_MANDATE' } }));
});
