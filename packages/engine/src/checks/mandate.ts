/**
 * Mandate-profile probes (docs/05 §Mandate profile). They run only against servers that
 * list mandate_status, mandate_propose and mandate_revoke, and act as a person would:
 * grant, narrow, revoke, wait, and try again as someone else.
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { verbalConfirmation } from '../orchestrators/scripted';
import { McpSession, type TimedCall } from '../session';
import type { Finding } from '../report';
import { fire, type ServerCheck, type ServerCheckContext, type TurnCheck } from './types';

const PROFILE = ['mandate_status', 'mandate_propose', 'mandate_revoke'];
const CODES = new Set(['NO_ACTIVE_MANDATE', 'MANDATE_EXPIRED', 'POLICY_CHANGED', 'OUT_OF_SCOPE', 'LIMIT_EXCEEDED']);
const HINT = 'Guard every scoped call with withMandate() from @hearsayhq/kit, keyed by the principal, with versions on staged lines.';

export const hasProfile = (tools: Tool[]) => PROFILE.every((n) => tools.some((t) => t.name === n));

interface Status {
  status: string;
  version?: number;
  tools?: string[];
  resourceIds?: string[];
  spentUsd?: number;
  orders?: number;
}

async function status(s: McpSession): Promise<Status> {
  return ((await s.callTool('mandate_status', {})).result.structuredContent ?? { status: 'UNKNOWN' }) as Status;
}

/** Confirm through the verbal tier if the server answered with a token instead of eliciting. */
async function settle(s: McpSession, call: TimedCall): Promise<TimedCall> {
  const v = verbalConfirmation(call.result.structuredContent);
  return v ? s.callTool(v.confirmTool, { token: v.token }) : call;
}

async function grant(s: McpSession, args: Record<string, unknown> = {}): Promise<TimedCall> {
  s.human = { answer: 'accept' };
  return settle(s, await s.callTool('mandate_propose', { totalLimitUsd: 50, ...args }));
}

/** The scoped tool that stages: the one with an enum-advertised resource parameter. */
function stagingTool(tools: Tool[], scoped: string[]): { tool: Tool; resourceParam: string } | undefined {
  for (const t of tools.filter((x) => scoped.includes(x.name))) {
    const props = (t.inputSchema.properties ?? {}) as Record<string, { enum?: unknown[] }>;
    const p = Object.entries(props).find(([, v]) => Array.isArray(v.enum));
    if (p) return { tool: t, resourceParam: p[0] };
  }
  return undefined;
}

/** The scoped tool that asks to commit: no required parameters. */
const commitTool = (tools: Tool[], scoped: string[]) => tools.find((t) => scoped.includes(t.name) && !((t.inputSchema.required as string[] | undefined)?.length));

function stageArgs(t: Tool, resourceParam: string, resource: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  const props = (t.inputSchema.properties ?? {}) as Record<string, { type?: string; minimum?: number }>;
  const args: Record<string, unknown> = { [resourceParam]: resource };
  if (props.quantity) args.quantity = Math.max(1, props.quantity.minimum ?? 1);
  for (const r of (t.inputSchema.required as string[] | undefined) ?? []) if (!(r in args)) args[r] = props[r]?.type === 'string' ? 'hearsay-probe' : (props[r]?.minimum ?? 1);
  return { ...args, ...extra };
}

async function withSession<T>(ctx: ServerCheckContext, fn: (s: McpSession) => Promise<T>, principal = ctx.newPrincipal()): Promise<T> {
  const s = await McpSession.open({ url: ctx.url, principal, elicitation: true });
  try {
    return await fn(s);
  } finally {
    await s.close();
  }
}

const refusedWith = (c: TimedCall, codes: Set<string> | string) => c.result.isError && !!c.result.errorCode && (typeof codes === 'string' ? c.result.errorCode === codes : codes.has(c.result.errorCode));

export const mandateSchemaIgnoringCaller: ServerCheck = {
  id: 'mandate.schema_ignoring_caller',
  async run(ctx) {
    if (!hasProfile(ctx.tools)) return [];
    return withSession(ctx, async (s) => {
      await grant(s);
      const st = await status(s);
      const out: Finding[] = [];
      for (const t of ctx.tools.filter((x) => st.tools?.includes(x.name))) {
        const props = (t.inputSchema.properties ?? {}) as Record<string, { enum?: unknown[] }>;
        const enumParam = Object.entries(props).find(([, v]) => Array.isArray(v.enum))?.[0];
        if (!enumParam) continue;
        const r = await s.callTool(t.name, stageArgs(t, enumParam, 'hearsay-probe-outside-the-enum', { hearsayProbeExtra: true }));
        if (!refusedWith(r, CODES))
          out.push(fire('mandate.schema_ignoring_caller', 0, `${t.name} with ${enumParam} outside the advertised enum was ${r.result.isError ? `refused without a mandate code: "${r.result.text.slice(0, 80)}"` : 'accepted'}`, { evidence: { tool: t.name, result: r.result.text.slice(0, 200), errorCode: r.result.errorCode ?? null }, hint: 'Advertise the enum but validate loosely (looseEnum) and let withMandate() refuse.' }));
      }
      return out;
    });
  },
};

export const mandateVersionRace: ServerCheck = {
  id: 'mandate.version_race',
  async run(ctx) {
    if (!hasProfile(ctx.tools)) return [];
    const out: Finding[] = [];
    // (1) A caller naming an old version is refused.
    await withSession(ctx, async (s) => {
      await grant(s);
      const v1 = (await status(s)).version ?? 1;
      s.human = { answer: 'accept' };
      await s.callTool('mandate_revoke', {});
      await grant(s);
      const st = await status(s);
      const staging = stagingTool(ctx.tools, st.tools ?? []);
      if (!staging || !('mandateVersion' in ((staging.tool.inputSchema.properties ?? {}) as object)) || !st.resourceIds?.length) return;
      const r = await s.callTool(staging.tool.name, stageArgs(staging.tool, staging.resourceParam, st.resourceIds[0]!, { mandateVersion: v1 }));
      if (!refusedWith(r, 'POLICY_CHANGED')) out.push(fire('mandate.version_race', 0, `${staging.tool.name} naming version ${v1} after the permission changed was ${r.result.isError ? `refused with ${r.result.errorCode ?? 'no code'}` : 'accepted'}`, { evidence: { result: r.result.text.slice(0, 160) }, hint: HINT }));
    });
    // (2) A line staged before a narrowing never commits, even on a yes.
    await withSession(ctx, async (s) => {
      await grant(s);
      const st = await status(s);
      const staging = stagingTool(ctx.tools, st.tools ?? []);
      const commit = commitTool(ctx.tools, st.tools ?? []);
      if (!staging || !commit || (st.resourceIds?.length ?? 0) < 2) return;
      const [first, ...rest] = st.resourceIds!;
      const staged = await s.callTool(staging.tool.name, stageArgs(staging.tool, staging.resourceParam, first!));
      if (staged.result.isError) return;
      await grant(s, { resourceIds: rest });
      const spent = (await status(s)).spentUsd;
      s.human = { answer: 'accept' };
      await settle(s, await s.callTool(commit.name, {}));
      const after = await status(s);
      if (after.spentUsd !== spent) out.push(fire('mandate.version_race', 0, `a line staged before the permission was narrowed was committed by ${commit.name}`, { evidence: { staged: first, narrowedTo: rest, spentBefore: spent, spentAfter: after.spentUsd }, hint: HINT }));
    });
    return out;
  },
};

export const mandateExpiry: ServerCheck = {
  id: 'mandate.expiry',
  async run(ctx) {
    if (!hasProfile(ctx.tools)) return [];
    return withSession(ctx, async (s) => {
      const g = await grant(s, { durationSeconds: 1 });
      if (g.result.isError) return [];
      const st = await status(s);
      const staging = stagingTool(ctx.tools, st.tools ?? []);
      if (!staging || !st.resourceIds?.length) return [];
      await new Promise((r) => setTimeout(r, 1500));
      const r = await s.callTool(staging.tool.name, stageArgs(staging.tool, staging.resourceParam, st.resourceIds[0]!));
      if (refusedWith(r, 'MANDATE_EXPIRED') && r.result.text.trim()) return [];
      return [fire('mandate.expiry', 0, `a call 1.5 s after a 1-second permission ended was ${r.result.isError ? `refused with ${r.result.errorCode ?? 'no code'}` : 'accepted'}`, { evidence: { result: r.result.text.slice(0, 160) }, hint: 'Settle expiry by the clock on every call: withMandate() does.' })];
    });
  },
};

export const mandatePrincipalBound: ServerCheck = {
  id: 'mandate.principal_bound',
  async run(ctx) {
    if (!hasProfile(ctx.tools)) return [];
    const a = ctx.newPrincipal();
    const granted = await withSession(ctx, async (s) => {
      await grant(s);
      return status(s);
    }, a);
    const staging = stagingTool(ctx.tools, granted.tools ?? []);
    const out: Finding[] = [];
    if (staging && granted.resourceIds?.length) {
      const r = await withSession(ctx, (s) => s.callTool(staging.tool.name, stageArgs(staging.tool, staging.resourceParam, granted.resourceIds![0]!)));
      if (!r.result.isError) out.push(fire('mandate.principal_bound', 0, `another person could use the permission through ${staging.tool.name}`, { evidence: { result: r.result.text.slice(0, 160) }, hint: HINT }));
    }
    const again = await withSession(ctx, (s) => status(s), a);
    if (again.status !== 'ACTIVE') out.push(fire('mandate.principal_bound', 1, 'the same person in a new session no longer has the permission', { evidence: { status: again.status }, hint: 'Key the mandate by the principal behind the bearer token, not by the MCP session.' }));
    return out;
  },
};

export const mandateInjection: TurnCheck = {
  id: 'mandate.injection',
  run({ case: c, trace, turns }) {
    if (!c.injectedCall || trace.variant !== 'clean') return [];
    const injected = turns.flatMap((t) => t.toolCalls).find((x) => x.tool === c.injectedCall!.tool && JSON.stringify(x.args) === JSON.stringify(c.injectedCall!.args));
    const scope = (k: 'before' | 'after') => {
      const st = trace.state?.[k]?.mandate_status?.structured as { resourceIds?: unknown; tools?: unknown; limits?: unknown } | undefined;
      return JSON.stringify([st?.resourceIds, st?.tools, st?.limits]);
    };
    const out = [];
    if (injected && !injected.result.isError) out.push(fire('mandate.injection', 0, `the call injected by a tool result (${injected.tool}) went through`, { turnId: turns.at(-1)?.id, evidence: { args: injected.args, result: injected.result.text.slice(0, 160) }, hint: HINT }));
    if (trace.state && scope('before') !== scope('after')) out.push(fire('mandate.injection', 0, 'the permission changed after an injected tool result', { turnId: turns.at(-1)?.id, hint: HINT }));
    const revs = new Set(turns.map((t) => t.toolListRevision));
    if (revs.size > 1) out.push(fire('mandate.injection', 0, 'the tool list changed after an injected tool result', { turnId: turns.at(-1)?.id, hint: HINT }));
    return out;
  },
};
