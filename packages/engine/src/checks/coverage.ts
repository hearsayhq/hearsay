/**
 * coverage.* (FR-067, D-025): what the visible suite never exercises. An agent that stops at green
 * stops where the suite stops (docs/15 §v2); these warnings show where that is. They run after all
 * cases, over the visible cases and their traces; holdouts never count.
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolCallRecord } from '../trace';
import { fire, type SuiteCheck, type SuiteCheckContext } from './types';

const PROPOSE = 'Propose a case for it in your pull request description; the suite is changed by a person, never by the agent (D-021).';

interface Prop {
  type?: string | string[];
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
}

const props = (t: Tool): Record<string, Prop> => ((t.inputSchema as { properties?: Record<string, Prop> } | undefined)?.properties ?? {});
const recorded = (ctx: SuiteCheckContext): ToolCallRecord[] => ctx.results.flatMap((r) => r.trace.turns.flatMap((t) => t.toolCalls));

/** Every (tool, args) the suite names or the runs made. */
function uses(ctx: SuiteCheckContext): Array<{ tool: string; args: Record<string, unknown> }> {
  const named = ctx.cases.flatMap((c) => [c.call, c.expect.tool ? { tool: c.expect.tool, args: c.expect.args ?? {} } : undefined].filter((x): x is { tool: string; args: Record<string, unknown> } => !!x));
  return [...named, ...recorded(ctx).map((x) => ({ tool: x.tool, args: x.args }))];
}

const norm = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase().replace(/[\s-]+/g, '_') : v);
const asNumber = (v: unknown) => (typeof v === 'number' ? v : typeof v === 'string' && /^\s*-?\d+(\.\d+)?\s*$/.test(v) ? Number(v) : undefined);
const isNumeric = (p: Prop) => [p.type].flat().some((x) => x === 'integer' || x === 'number');

export const coverageTools: SuiteCheck = {
  id: 'coverage.tools',
  run(ctx) {
    const used = new Set(uses(ctx).map((u) => u.tool));
    return ctx.tools
      .filter((t) => !used.has(t.name))
      .map((t) => fire('coverage.tools', 0, `${t.name} has no case`, { evidence: { tool: t.name }, hint: PROPOSE }));
  },
};

export const coverageValues: SuiteCheck = {
  id: 'coverage.values',
  run(ctx) {
    const all = uses(ctx);
    const out = [];
    for (const t of ctx.tools) {
      const mine = all.filter((u) => u.tool === t.name);
      if (!mine.length) continue; // coverage.tools says it already
      for (const [name, p] of Object.entries(props(t))) {
        const values = mine.map((u) => u.args[name]).filter((v) => v !== undefined);
        if (Array.isArray(p.enum)) {
          const seen = new Set(values.map(norm));
          const missing = p.enum.filter((v) => !seen.has(norm(v)));
          if (missing.length)
            out.push(fire('coverage.values', 0, `${t.name}.${name}: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ` and ${missing.length - 5} more` : ''} never used`, { evidence: { tool: t.name, param: name, missing }, hint: PROPOSE }));
        }
        if (isNumeric(p) && (p.minimum !== undefined || p.maximum !== undefined) && values.length) {
          const numbers = values.map(asNumber).filter((n): n is number => n !== undefined);
          const outside = numbers.some((n) => (p.minimum !== undefined && n < p.minimum) || (p.maximum !== undefined && n > p.maximum));
          if (!outside)
            out.push(fire('coverage.values', 1, `${t.name}.${name}: no case tries a value outside ${p.minimum ?? '−∞'}–${p.maximum ?? '∞'}`, { evidence: { tool: t.name, param: name, minimum: p.minimum, maximum: p.maximum }, hint: PROPOSE }));
        }
      }
    }
    return out;
  },
};

export const coverageDecline: SuiteCheck = {
  id: 'coverage.decline',
  run(ctx) {
    const calls = recorded(ctx);
    const asking = new Set([
      ...calls.filter((x) => x.elicitations?.length).map((x) => x.tool),
      ...ctx.cases.filter((c) => c.expect.confirm === 'required' && c.expect.tool).map((c) => c.expect.tool!),
    ]);
    const declined = new Set([
      ...calls.filter((x) => x.elicitations?.some((e) => e.action !== 'accept')).map((x) => x.tool),
      ...ctx.cases.filter((c) => c.human.answer !== 'accept').flatMap((c) => [c.expect.tool, c.call?.tool].filter((x): x is string => !!x)),
    ]);
    return [...asking]
      .filter((tool) => !declined.has(tool))
      .sort()
      .map((tool) => fire('coverage.decline', 0, `${tool} asks for confirmation, but no case says no`, { evidence: { tool }, hint: PROPOSE }));
  },
};

const AMOUNT = /amount|usd|price|total|quantity|qty|count/i;

export const coverageLimits: SuiteCheck = {
  id: 'coverage.limits',
  run(ctx) {
    // The mandate profile is on when the suite asks for any mandate check (docs/05 §Mandate profile).
    if (!ctx.suite.checks.some((id) => id.startsWith('mandate.'))) return [];
    const calls = recorded(ctx);
    const limited = new Set([
      ...calls.filter((x) => x.result.errorCode === 'LIMIT_EXCEEDED').map((x) => x.tool),
      ...ctx.cases.filter((c) => c.expect.refusal === 'LIMIT_EXCEEDED').flatMap((c) => [c.expect.tool, c.call?.tool].filter((x): x is string => !!x)),
    ]);
    return ctx.tools
      .filter((t) => t.annotations?.readOnlyHint !== true)
      .filter((t) => {
        const names = Object.entries(props(t));
        return names.some(([n, p]) => AMOUNT.test(n) && isNumeric(p)) && !names.some(([n]) => /limit/i.test(n));
      })
      .filter((t) => !limited.has(t.name))
      .map((t) => fire('coverage.limits', 0, `${t.name} takes an amount, but no case goes over the limit`, { evidence: { tool: t.name }, hint: PROPOSE }));
  },
};
