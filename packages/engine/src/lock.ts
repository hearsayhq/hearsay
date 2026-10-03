/**
 * Suite lock (FR-036, docs/03 §Holdouts and the lock): one SHA-256 per suite file in
 * `.hearsay-lock` next to the suites, and per file recorded for it (its variants file and its
 * cassette, or that it has none). Deterministic protection against a run that changed its own
 * expectations or dropped its own recordings; no tool here asks anyone for anything (D-021).
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { parse } from 'yaml';

export const LOCK_FILE = '.hearsay-lock';
const ABSENT = 'absent';

export interface SuiteLock {
  version: 1;
  /** File name (relative to the lock's directory) → "sha256:<hex>", or "absent" for a recording a suite does not have. */
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

const fingerprint = async (path: string) => readFile(path, 'utf8').then(hash, () => ABSENT);

/** The suite file and the recordings that belong to it, relative to the lock's directory. */
async function filesOf(suitePath: string): Promise<string[]> {
  let name: unknown;
  try {
    name = (parse(await readFile(suitePath, 'utf8')) as { suite?: unknown } | null)?.suite;
  } catch {
    name = undefined;
  }
  const own = basename(suitePath);
  return typeof name === 'string' && name ? [own, `variants/${name}.json`, `cassettes/${name}.json`] : [own];
}

/** Lock these suites (all in one directory). Existing entries for other files are kept. Returns the lock path. */
export async function lockSuites(paths: string[]): Promise<string> {
  if (!paths.length) throw new Error('nothing to lock');
  const dir = dirname(paths[0]!);
  if (paths.some((p) => dirname(p) !== dir)) throw new Error('lock suites of one directory at a time');
  const lockPath = join(dir, LOCK_FILE);
  const lock: SuiteLock = (await readLock(lockPath)) ?? { version: 1, suites: {} };
  for (const p of paths) for (const f of await filesOf(p)) lock.suites[f] = await fingerprint(join(dir, f));
  lock.suites = Object.fromEntries(Object.entries(lock.suites).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(lockPath, JSON.stringify(lock, null, 2) + '\n');
  return lockPath;
}

export type IntegrityResult =
  | { state: 'unlocked' }
  | { state: 'intact'; lockPath: string }
  | { state: 'changed'; lockPath: string; file: string; expected: string; actual: string };

export async function checkSuiteIntegrity(suitePath: string): Promise<IntegrityResult> {
  const lockPath = lockPathFor(suitePath);
  const lock = await readLock(lockPath);
  if (!lock?.suites[basename(suitePath)]) return { state: 'unlocked' };
  for (const f of await filesOf(suitePath)) {
    const expected = lock.suites[f];
    if (!expected) continue; // locked before recordings were locked
    const actual = await fingerprint(join(dirname(suitePath), f));
    if (actual !== expected) return { state: 'changed', lockPath, file: join(dirname(suitePath), f), expected, actual };
  }
  return { state: 'intact', lockPath };
}
