/**
 * Suite lock (FR-036, docs/03 §Holdouts and the lock): one SHA-256 per suite file in
 * `.hearsay-lock` next to the suites. Deterministic protection against a run that
 * changed its own expectations; no tool here asks anyone for anything (D-021).
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';

export const LOCK_FILE = '.hearsay-lock';

export interface SuiteLock {
  version: 1;
  /** File name (relative to the lock's directory) → "sha256:<hex>". */
  suites: Record<string, string>;
}

const hash = (content: string) => `sha256:${createHash('sha256').update(content).digest('hex')}`;
export const lockPathFor = (suitePath: string) => join(dirname(suitePath), LOCK_FILE);

async function readLock(path: string): Promise<SuiteLock | undefined> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as SuiteLock;
  } catch {
    return undefined;
  }
}

/** Lock these suites (all in one directory). Existing entries for other files are kept. Returns the lock path. */
export async function lockSuites(paths: string[]): Promise<string> {
  if (!paths.length) throw new Error('nothing to lock');
  const dir = dirname(paths[0]!);
  if (paths.some((p) => dirname(p) !== dir)) throw new Error('lock suites of one directory at a time');
  const lockPath = join(dir, LOCK_FILE);
  const lock: SuiteLock = (await readLock(lockPath)) ?? { version: 1, suites: {} };
  for (const p of paths) lock.suites[basename(p)] = hash(await readFile(p, 'utf8'));
  lock.suites = Object.fromEntries(Object.entries(lock.suites).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(lockPath, JSON.stringify(lock, null, 2) + '\n');
  return lockPath;
}

export type IntegrityResult =
  | { state: 'unlocked' }
  | { state: 'intact'; lockPath: string }
  | { state: 'changed'; lockPath: string; expected: string; actual: string };

export async function checkSuiteIntegrity(suitePath: string): Promise<IntegrityResult> {
  const lockPath = lockPathFor(suitePath);
  const lock = await readLock(lockPath);
  const expected = lock?.suites[basename(suitePath)];
  if (!expected) return { state: 'unlocked' };
  const actual = hash(await readFile(suitePath, 'utf8'));
  return actual === expected ? { state: 'intact', lockPath } : { state: 'changed', lockPath, expected, actual };
}
