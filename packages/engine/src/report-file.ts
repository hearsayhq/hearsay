import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Report } from './report';

/** Write the JSON report to `dir` (default reports/) and return its path (FR-030). */
export async function writeReport(report: Report, dir = 'reports'): Promise<string> {
  await mkdir(dir, { recursive: true });
  const stamp = report.startedAt.replace(/:/g, '-').replace(/\.\d+Z$/, '');
  const path = join(dir, `${report.suite}-${stamp}.json`);
  await writeFile(path, JSON.stringify(report, null, 2) + '\n');
  return path;
}
