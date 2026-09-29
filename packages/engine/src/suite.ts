/**
 * Suite files (YAML) are the user-facing contract of the engine: what a person
 * says, what should happen, and under which conditions. Semantics: docs/03
 * §Expectations and §Session isolation.
 */
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { z } from 'zod';
import { CHECKS, CHECK_IDS, PERTURBATION_IDS } from './catalog';

const checkId = z
  .string()
  .refine((id) => CHECK_IDS.has(id), { error: (iss) => `unknown check "${String(iss.input)}"` });
const perturbationId = z
  .string()
  .refine((id) => PERTURBATION_IDS.has(id), { error: (iss) => `unknown perturbation "${String(iss.input)}"` });

const Args = z.record(z.string(), z.unknown());

const ToolCall = z.object({ tool: z.string(), args: Args.default({}) });

const Expect = z
  .object({
    /** Some call in the turn names this tool. */
    tool: z.string().optional(),
    /** Subset match against the first call to `tool`, after normalisation. */
    args: Args.optional(),
    /** No call to any tool may carry these argument values (e.g. room: all). */
    argsMustNotContain: Args.optional(),
    /** Expect that no tool is called (e.g. the assistant should ask back). */
    noTool: z.boolean().optional(),
    /** Expected refusal code, e.g. OUT_OF_SCOPE. */
    refusal: z.string().optional(),
    /** required: the person is asked before anything commits. forbidden: no confirmation for this harmless action. */
    confirm: z.enum(['required', 'forbidden']).optional(),
    spokenIncludes: z.array(z.string()).optional(),
  })
  .strict();

const Human = z
  .object({
    /** How the simulated person answers a confirmation, by elicitation or by voice. */
    answer: z.enum(['accept', 'decline', 'cancel']).default('accept'),
    content: Args.optional(),
  })
  .strict();

const Client = z
  .object({
    /** Declare the elicitation capability at initialize. false simulates a host without it. */
    elicitation: z.boolean().default(true),
  })
  .strict();

const Case = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/, 'kebab-case'),
    /** One utterance, or several for a multi-turn case. */
    say: z.union([z.string(), z.array(z.string()).min(1)]),
    /** Scripted mode only: the call the stand-in planner makes. Defaults to expect.tool/args. */
    call: ToolCall.optional(),
    /** Scripted mode only: a compromised model makes this call after the case's call (mandate.injection). */
    injectedCall: ToolCall.optional(),
    /** Cases that run first in the same session, in order (e.g. granting a mandate). */
    after: z.array(z.string()).optional(),
    human: Human.prefault({}),
    /** Applies to the whole session, including the `after` chain. */
    client: Client.prefault({}),
    expect: Expect,
    fuzz: z.array(perturbationId).default([]),
    /** Turn-scope checks added to the suite's checks for this case. */
    checks: z.array(checkId).optional(),
  })
  .strict();

export const SuiteSchema = z
  .object({
    suite: z.string(),
    description: z.string().optional(),
    server: z.object({
      url: z.string().url(),
      /** Command that starts the server; the runner waits for the URL to answer. */
      start: z.string().optional(),
    }),
    orchestrator: z.enum(['scripted', 'llm', 'replay']).default('scripted'),
    /** Hearsay's own thresholds. Amazon thresholds are fixed and cannot be loosened here (D-011). */
    budget: z
      .object({
        firstAudioMs: z.number().int().positive().default(1500),
        spokenChars: z.number().int().positive().default(280),
        listItems: z.number().int().positive().default(3),
      })
      .strict()
      .prefault({}),
    /** Constants for the parts of a spoken turn the engine does not run (docs/03 §Latency model). */
    latencyModel: z
      .object({
        asrMs: z.number().int().nonnegative().default(300),
        speakTtfbMs: z.number().int().nonnegative().default(200),
      })
      .strict()
      .prefault({}),
    /** Checks for every case (turn scope) and once per suite (server scope). */
    checks: z.array(checkId).default([]),
    cases: z.array(Case).min(1),
  })
  .strict()
  .superRefine((s, ctx) => {
    const ids = new Set<string>();
    const serverScope = new Set(CHECKS.filter((c) => c.scope === 'server').map((c) => c.id));
    for (const c of s.cases) {
      if (ids.has(c.id)) ctx.addIssue({ code: 'custom', message: `duplicate case id "${c.id}"` });
      ids.add(c.id);
      for (const dep of c.after ?? [])
        if (!ids.has(dep)) ctx.addIssue({ code: 'custom', message: `case "${c.id}" runs after unknown or later case "${dep}"` });
      for (const id of c.checks ?? [])
        if (serverScope.has(id)) ctx.addIssue({ code: 'custom', message: `case "${c.id}": "${id}" runs once per suite; list it in the suite's checks` });
      if (s.orchestrator === 'scripted' && !c.call && !c.expect.tool && !c.expect.noTool)
        ctx.addIssue({ code: 'custom', message: `case "${c.id}": scripted mode needs "call" or "expect.tool"` });
      if (s.orchestrator === 'scripted' && Array.isArray(c.say) && c.say.length > 1)
        ctx.addIssue({ code: 'custom', message: `case "${c.id}": scripted mode plays one utterance per case` });
      if (s.orchestrator !== 'scripted' && (c.call || c.injectedCall))
        ctx.addIssue({ code: 'custom', message: `case "${c.id}": "call" and "injectedCall" are scripted-mode only` });
    }
  });

export type Suite = z.infer<typeof SuiteSchema>;
export type SuiteCase = Suite['cases'][number];

/** Turn-scope checks for one case: always-on checks, the suite's, plus the case's own (they add, never replace). */
export function turnChecksFor(suite: Suite, c: SuiteCase): string[] {
  const turn = new Set(CHECKS.filter((x) => x.scope === 'turn').map((x) => x.id));
  const always = CHECKS.filter((x) => x.alwaysOn).map((x) => x.id);
  return [...new Set([...always, ...suite.checks.filter((id) => turn.has(id)), ...(c.checks ?? [])])];
}

/** Server-scope checks: run once per suite. */
export function serverChecksFor(suite: Suite): string[] {
  const server = new Set(CHECKS.filter((x) => x.scope === 'server').map((x) => x.id));
  return suite.checks.filter((id) => server.has(id));
}

export async function loadSuite(path: string): Promise<Suite> {
  const raw = parse(await readFile(path, 'utf8'));
  const res = SuiteSchema.safeParse(raw);
  if (!res.success) {
    const issues = res.error.issues.map((i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n');
    throw new Error(`${path} is not a valid suite:\n${issues}`);
  }
  return res.data;
}
