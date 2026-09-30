/**
 * `hearsay lint <url>` (FR-031): server-scope checks only, no suite, no utterances.
 * The result is a Report with no cases, so CLI and console display it the same way.
 */
import { LINT_CHECKS, SERVER_CHECKS } from './checks/index';
import type { Finding, Report } from './report';
import { newPrincipal } from './runner';
import { McpSession } from './session';

/** `principal` is sent as the bearer token; a server that requires one gets it (FR-062 scan). */
export async function lintServer(url: string, principal = newPrincipal()): Promise<Report> {
  const startedAt = new Date().toISOString();
  const session = await McpSession.open({ url, principal, elicitation: false });
  const tools = session.tools;
  const server = session.serverInfo();
  await session.close();

  const findings: Finding[] = [];
  for (const id of LINT_CHECKS) findings.push(...(await SERVER_CHECKS.get(id)!.run({ url, tools, server, newPrincipal })));
  const count = (s: Finding['severity']) => findings.filter((f) => f.severity === s).length;
  return {
    suite: `lint ${new URL(url).host}`,
    startedAt,
    orchestrator: 'scripted',
    seed: 1,
    tools,
    serverFindings: findings.sort((a, b) => a.checkId.localeCompare(b.checkId)),
    cases: [],
    skippedChecks: [],
    summary: { cases: 0, runs: 0, failedRuns: 0, errors: count('error'), warnings: count('warn'), infos: count('info'), skipped: 0 },
  };
}
