/**
 * Household Orders: consent and the mandate behind a voice assistant (servers/household-orders/README.md).
 * Built on @hearsayhq/kit. The flawed build (flawed.ts, HEARSAY_FIXED=0) is the fixture the
 * consent and mandate checks must fail on (docs/08), and never the default.
 */
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { Mandate } from '@hearsayhq/mandate';
import { askVerbally, confirm, list, money, refuse, speak, withMandate, type SessionContext } from '@hearsayhq/kit';
import { CATALOG, GROCERIES, bySku, type Item } from './catalog';
import { SCOPED_TOOLS, durationWords, lineWords, names, sku, type Proposal, type Shared } from './common';
import { cartTotal, type Account, type Line } from './store';

export function createHouseholdServer(shared: Shared, ctx: SessionContext): McpServer {
  const server = new McpServer({ name: 'hearsay-household-orders', version: '0.1.0' });
  const key = ctx.principal;
  const account = () => shared.store.get(key);
  const now = () => shared.now();
  const cartBinding = (a: Account) => ({ lines: a.cart.map((l) => ({ sku: l.sku, amountMinor: l.amountMinor })), totalMinor: cartTotal(a) });

  function activate(p: Proposal): Mandate {
    const a = account();
    const prev = a.mandate?.status === 'ACTIVE' ? a.mandate : undefined;
    a.mandate = {
      id: randomUUID(),
      version: (a.mandate?.version ?? 0) + 1,
      status: 'ACTIVE',
      tools: SCOPED_TOOLS,
      resourceIds: p.resourceIds,
      limits: { currency: 'USD', totalMinor: p.totalMinor, ...(p.perCallMinor ? { perCallMinor: p.perCallMinor } : {}) },
      spentMinor: prev?.spentMinor ?? 0,
      createdAt: shared.now(),
      expiresAt: shared.now() + p.durationSeconds * 1000,
    };
    return a.mandate;
  }

  /** Every line again, against the mandate as it is now; the stamp catches narrowing (docs/06 §Lifecycle). */
  function reauthorize(a: Account): CallToolResult | undefined {
    for (const l of a.cart) {
      const r = withMandate(a.mandate, { tool: 'orders_request_checkout', mandateVersion: l.version, resourceId: l.sku }, now());
      if (r) return r;
    }
    return withMandate(a.mandate, { tool: 'orders_request_checkout', amountMinor: cartTotal(a) }, now());
  }

  function commit(a: Account): CallToolResult {
    const total = cartTotal(a);
    const said = list(a.cart.map(lineWords), { max: 5 });
    a.orders.push({ lines: a.cart, totalMinor: total, at: shared.now() });
    if (a.mandate) a.mandate.spentMinor += total;
    a.cart = [];
    shared.tokens.invalidate(key);
    return speak(`Order placed: ${said}, ${money(total)}.`, { placed: true, totalMinor: total });
  }

  const ask = async (question: string, commits: boolean): Promise<Awaited<ReturnType<typeof confirm>>> =>
    confirm(server, question, { commits, insideMandate: account().mandate?.status === 'ACTIVE' });

  server.registerTool(
    'orders_catalog_search',
    {
      title: 'Search the grocery catalog',
      description: 'Use when the person asks what is available or what something costs.',
      inputSchema: { query: z.string().min(1).max(60).describe('What to look for, such as oat milk.') },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ query }) => {
      const q = query.toLowerCase();
      const exact = CATALOG.filter((i) => i.synonyms.includes(q));
      const hits = exact.length ? exact : CATALOG.filter((i) => i.synonyms.some((s) => s.includes(q) || q.includes(s)));
      if (!hits.length) return speak("I couldn't find that. You can ask for milk, eggs, bread, fruit or oat milk.", { items: [] });
      const lines = hits.slice(0, 3).map((i) => `${i.name}, ${money(i.priceMinor)}${i.unit ? ` a ${i.unit}` : ''}. ${i.description}`);
      return speak(`I found ${lines.join(' And ')}`, { items: hits.map((i) => ({ sku: i.sku, priceMinor: i.priceMinor })) });
    },
  );

  server.registerTool(
    'mandate_status',
    {
      title: 'What the assistant may do',
      description: 'Use when the person asks what the assistant is allowed to buy, how much is left, or until when.',
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      const m = account().mandate;
      if (m?.status === 'ACTIVE' && shared.now() >= m.expiresAt) m.status = 'EXPIRED';
      const pendingMinor = cartTotal(account());
      const state = m ? { status: m.status, version: m.version, tools: m.tools, resourceIds: m.resourceIds, limits: m.limits, spentUsd: m.spentMinor / 100, pendingUsd: pendingMinor / 100, expiresAt: new Date(m.expiresAt).toISOString() } : { status: 'NONE', spentUsd: 0, pendingUsd: pendingMinor / 100 };
      if (!m || m.status !== 'ACTIVE') return speak("I'm not allowed to buy anything right now.", { ...state, orders: account().orders.length });
      return speak(`I may reorder ${names(m.resourceIds)}, up to ${money(m.limits!.totalMinor!)}. So far I've spent ${money(m.spentMinor)}.`, { ...state, orders: account().orders.length });
    },
  );

  server.registerTool(
    'mandate_propose',
    {
      title: 'Ask for permission to reorder',
      description: 'Use when the person says what the assistant may buy, how much, and for how long, such as "you can reorder groceries up to fifty dollars today". The person confirms before it takes effect.',
      inputSchema: {
        totalLimitUsd: z.number().min(1).max(500).describe('The most the assistant may spend in total, in dollars.'),
        perCallLimitUsd: z.number().min(1).max(500).optional().describe('The most for a single item, in dollars.'),
        resourceIds: z.array(sku.schema).max(10).optional().describe('Which items; groceries if not given.'),
        durationSeconds: z.number().int().min(1).max(86_400).optional().describe('How long the permission lasts, in seconds; until the end of today if not given.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ totalLimitUsd, perCallLimitUsd, resourceIds, durationSeconds }) => {
      const ids = (resourceIds ?? GROCERIES).map((r) => sku.normalize(r)).filter((x): x is string => !!x);
      if (!ids.length) return refuse('Which items should I be allowed to reorder?', 'MISSING_ITEMS');
      const p: Proposal = { resourceIds: [...new Set(ids)], totalMinor: Math.round(totalLimitUsd * 100), ...(perCallLimitUsd ? { perCallMinor: Math.round(perCallLimitUsd * 100) } : {}), durationSeconds: durationSeconds ?? 12 * 3600 };
      const question = `Allow me to reorder ${names(p.resourceIds)}, up to ${money(p.totalMinor)} in total, for ${durationWords(p.durationSeconds)}?`;
      const answer = await ask(question, true);
      if (answer === 'accepted') {
        const m = activate(p);
        return speak(`Done. I can reorder ${names(m.resourceIds)} up to ${money(p.totalMinor)}.`, { version: m.version });
      }
      if (answer === 'unavailable') {
        const issued = shared.tokens.issue(key, 'grant', p as unknown as Record<string, unknown>);
        shared.pending.set(issued.token, { action: 'grant', key, proposal: p });
        return askVerbally(question, issued, 'orders_confirm');
      }
      return speak("Okay, I won't buy anything.", { granted: false });
    },
  );

  server.registerTool(
    'mandate_revoke',
    {
      title: 'Take back the permission',
      description: 'Use when the person says the assistant should stop buying things.',
      inputSchema: {},
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      const m = account().mandate;
      if (m?.status === 'ACTIVE') {
        m.status = 'REVOKED';
        m.version++;
        m.endedAt = shared.now();
        m.endedReason = 'REVOKED';
      }
      shared.tokens.invalidate(key);
      return speak("Done. I can't buy anything for you now.", { revoked: true });
    },
  );

  server.registerTool(
    'orders_stage_cart',
    {
      title: 'Add to the cart',
      description: 'Use when the person asks to add an item to the grocery order, by count ("two cartons of milk") or by amount ("fifteen dollars of fruit"). Nothing is ordered yet.',
      inputSchema: {
        sku: sku.schema,
        quantity: z.number().int().min(1).max(20).optional().describe('How many, for counted items.'),
        amountUsd: z.number().min(0.5).max(500).optional().describe('How much, in dollars, for items sold by amount.'),
        mandateVersion: z.number().int().min(1).optional().describe('The permission version the caller read, if it knows one.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ sku: raw, quantity, amountUsd, mandateVersion }) => {
      const a = account();
      const id = sku.normalize(raw) ?? raw;
      const item: Item | undefined = bySku.get(id);
      const amountMinor = amountUsd !== undefined ? Math.round(amountUsd * 100) : quantity !== undefined && item ? quantity * item.priceMinor : undefined;
      const refusal = withMandate(
        a.mandate,
        { tool: 'orders_stage_cart', ...(mandateVersion !== undefined ? { mandateVersion } : {}), resourceId: id, ...(quantity !== undefined ? { amountMinor } : {}), pendingMinor: cartTotal(a) },
        now(),
      );
      if (refusal) return refusal;
      if (!item) return refuse(`I couldn't find ${raw.replace(/[_-]+/g, ' ')}. You can ask for milk, eggs, bread or fruit.`, 'NOT_FOUND');
      if (amountMinor === undefined) return refuse(item.unit ? `How many ${item.unit}s of ${item.name} should I add?` : `How much ${item.name} should I add, in dollars?`, 'MISSING_QUANTITY');
      const line: Line = { sku: id, ...(quantity !== undefined && amountUsd === undefined ? { quantity } : {}), amountMinor, version: a.mandate!.version };
      a.cart.push(line);
      shared.tokens.invalidate(key);
      return speak(`Added ${lineWords(line)}. Your cart is ${money(cartTotal(a))}.`, { staged: true, cartTotalMinor: cartTotal(a) });
    },
  );

  server.registerTool(
    'orders_review_cart',
    {
      title: 'Read the cart',
      description: 'Use when the person asks what is in the cart or what it costs.',
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      const a = account();
      if (!a.cart.length) return speak('Your cart is empty.', { lines: [], totalMinor: 0 });
      return speak(`Your cart: ${list(a.cart.map(lineWords))}. ${money(cartTotal(a))} in total.`, cartBinding(a));
    },
  );

  server.registerTool(
    'orders_request_checkout',
    {
      title: 'Ask to place the order',
      description: 'Use when the person asks to place or send the order. The person is asked to confirm items and total; only their yes places it.',
      inputSchema: {},
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async () => {
      const a = account();
      if (!a.cart.length) return refuse('Your cart is empty. Add something first.', 'EMPTY_CART');
      const stale = reauthorize(a);
      if (stale) return stale;
      const question = `Place the order: ${list(a.cart.map(lineWords), { max: 5 })}, ${money(cartTotal(a))}?`;
      const answer = await ask(question, true);
      if (answer === 'accepted') return commit(a);
      if (answer === 'unavailable') {
        const issued = shared.tokens.issue(key, 'checkout', cartBinding(a));
        shared.pending.set(issued.token, { action: 'checkout', key });
        return askVerbally(question, issued, 'orders_confirm');
      }
      return speak('Okay, I did not place the order. Your cart is still there.', { placed: false });
    },
  );

  server.registerTool(
    'orders_confirm',
    {
      title: 'Confirm by voice',
      description: 'Use only after the person answered yes to a question the assistant asked out loud, passing the token that question came with.',
      inputSchema: { token: z.string().min(1).max(100).describe('The token from the question the person said yes to.') },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async ({ token }) => {
      const p = shared.pending.get(token);
      if (!p || p.key !== key) return refuse("There's nothing waiting for your yes. Ask me again.", 'NO_PENDING');
      const a = account();
      const binding = p.action === 'checkout' ? cartBinding(a) : (p.proposal as unknown as Record<string, unknown>);
      const r = shared.tokens.redeem(key, token, binding);
      if (!r.ok) {
        const say = { expired: 'That question ran out. Ask me again.', used: 'That yes was already used. Ask me again.', mismatch: "Your cart changed since I asked, so I didn't place it. Want to hear it again?", unknown: "There's nothing waiting for your yes. Ask me again." } as const;
        return refuse(say[r.reason], `TOKEN_${r.reason.toUpperCase()}`);
      }
      shared.pending.delete(token);
      if (p.action === 'grant') {
        const m = activate(p.proposal!);
        return speak(`Done. I can reorder ${names(m.resourceIds)} up to ${money(p.proposal!.totalMinor)}.`, { version: m.version });
      }
      const stale = reauthorize(a);
      if (stale) return stale;
      return commit(a);
    },
  );

  return server;
}

export { tokenTtl, type Shared } from './common';
