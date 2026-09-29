/**
 * Suite files (YAML) are the user-facing contract of the engine: what to say,
 * what should happen, and under which conditions. Format: docs/03 §Suites.
 */
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { z } from 'zod';
import { CHECK_IDS, PERTURBATION_IDS } from './catalog';

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
    /** Expected tool; args are a subset match. */
    tool: z.string().optional(),
    args: Args.optional(),
    /** Expect that no tool is called (e.g. the assistant should ask back). */
    noTool: z.boolean().optional(),
    /** Expected refusal code, e.g. OUT_OF_SCOPE. */
    refusal: z.string().optional(),
    /** Whether the server must ask the human via elicitation before acting. */
    confirm: z.enum(['required', 'forbidden']).optional(),
    spokenIncludes: z.array(z.string()).optional(),
  })
  .strict();

const Human = z
  .object({
    /** How the simulated person answers an elicitation. */
    elicitation: z.enum(['accept', 'decline', 'cancel']).default('accept'),
    content: Args.optional(),
  })
  .strict();

const Case = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/, 'kebab-case'),
    /** One utterance, or several for a multi-turn case. */
    say: z.union([z.string(), z.array(z.string()).min(1)]),
    /** Scripted mode only: the call the stand-in planner makes. Defaults to expect.tool/args. */
    call: ToolCall.optional(),
    /** Cases that run before this one in the same session (e.g. granting a mandate). */
    after: z.array(z.string()).optional(),
    human: Human.prefault({}),
    expect: Expect,
    fuzz: z.array(perturbationId).default([]),
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
    budget: z
      .object({
        firstAudioMs: z.number().int().positive().default(1500),
        toolMs: z.number().int().positive().default(800),
        spokenChars: z.number().int().positive().default(280),
      })
      .prefault({}),
    /** Checks applied to every case unless the case overrides them. */
    checks: z.array(checkId).default([]),
    cases: z.array(Case).min(1),
  })
  .strict()
  .superRefine((s, ctx) => {
    const ids = new Set<string>();
    for (const c of s.cases) {
      if (ids.has(c.id)) ctx.addIssue({ code: 'custom', message: `duplicate case id "${c.id}"` });
      ids.add(c.id);
      for (const dep of c.after ?? [])
        if (!ids.has(dep)) ctx.addIssue({ code: 'custom', message: `case "${c.id}" runs after unknown or later case "${dep}"` });
      if (s.orchestrator === 'scripted' && !c.call && !c.expect.tool && !c.expect.noTool)
        ctx.addIssue({ code: 'custom', message: `case "${c.id}": scripted mode needs "call" or "expect.tool"` });
    }
  });

export type Suite = z.infer<typeof SuiteSchema>;
export type SuiteCase = Suite['cases'][number];

export async function loadSuite(path: string): Promise<Suite> {
  const raw = parse(await readFile(path, 'utf8'));
  const res = SuiteSchema.safeParse(raw);
  if (!res.success) {
    const issues = res.error.issues.map((i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n');
    throw new Error(`${path} is not a valid suite:\n${issues}`);
  }
  return res.data;
}
