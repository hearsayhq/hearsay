import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { CHECKS, type CheckSpec, type Question } from '../catalog';
import type { Finding } from '../report';
import type { Suite, SuiteCase } from '../suite';
import type { ServerInfo, Trace, Turn } from '../trace';

export interface TurnCheckContext {
  suite: Suite;
  case: SuiteCase;
  trace: Trace;
  /** The case's own turns; setup turns from `after` chains are excluded. */
  turns: Turn[];
  tools: Tool[];
}

export interface ServerCheckContext {
  suite: Suite;
  url: string;
  tools: Tool[];
  /** What the first session negotiated. */
  server: ServerInfo;
  newPrincipal(): string;
}

export interface TurnCheck {
  id: string;
  run(ctx: TurnCheckContext): Finding[];
}

export interface ServerCheck {
  id: string;
  run(ctx: ServerCheckContext): Promise<Finding[]>;
}

const byId = new Map(CHECKS.map((c) => [c.id, c]));

export function spec(id: string): CheckSpec {
  const c = byId.get(id);
  if (!c) throw new Error(`unknown check ${id}`);
  return c;
}

/** The threshold's value, with the suite's budget applied where the catalog allows it (D-011). */
export function limit(id: string, index: number, suite: Suite): number {
  const t = spec(id).thresholds[index];
  if (t?.value === undefined) throw new Error(`${id} threshold ${index} has no value`);
  return t.budgetKey ? suite.budget[t.budgetKey] : t.value;
}

/** Build a finding from threshold `index` of check `id`: severity and source come from the catalog. */
export function fire(
  id: string,
  index: number,
  message: string,
  extra: { hint?: string; turnId?: string; evidence?: Record<string, unknown>; question?: Question } = {},
): Finding {
  const c = spec(id);
  const t = c.thresholds[index];
  if (!t) throw new Error(`${id} has no threshold ${index}`);
  return {
    checkId: id,
    severity: t.severity,
    question: extra.question ?? c.question,
    source: t.source,
    message,
    ...(extra.hint ? { hint: extra.hint } : {}),
    ...(extra.turnId ? { turnId: extra.turnId } : {}),
    ...(extra.evidence ? { evidence: extra.evidence } : {}),
  };
}
