import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Report } from './report';

/** Write the JSON report to `dir` (default reports/) and return its path (FR-030). */
export async function writeReport(report: Report, dir = 'reports'): Promise<string> {
  await mkdir(dir, { recursive: true });
  const stamp = report.startedAt.replace(/:/g, '-').replace(/\.\d+Z$/, '');
  const name = report.suite.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const path = join(dir, `${name}-${stamp}.json`);
  await writeFile(path, JSON.stringify(report, null, 2) + '\n');
  return path;
}
