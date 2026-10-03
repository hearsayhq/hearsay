/**
 * Recorded mishearings for asr.roundtrip (FR-017): `<suite dir>/variants/<suite>.json`,
 * written by `hearsay gen-variants`, committed, replayed without any AWS call. A recording
 * belongs to the sentence it was made from; once a case says something else, it is not replayed.
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Suite, SuiteCase } from '../suite';

export interface RecordedVariants {
  suite: string;
  provenance: { voices: string[]; provider: string; recordedAt: string; channel: string };
  /** Case id → the sentence that was spoken for it. */
  said?: Record<string, string>;
  cases: Record<string, Array<{ heard: string; voice: string; snrDb: number; seed: number }>>;
}

export const recordedPathFor = (suitePath: string, suiteName: string) => join(dirname(suitePath), 'variants', `${suiteName}.json`);

/** What gen-variants speaks for a case: its last utterance. */
export const lastSaid = (c: SuiteCase) => (Array.isArray(c.say) ? c.say.at(-1)! : c.say);

export async function readRecorded(suitePath: string, suiteName: string): Promise<RecordedVariants | undefined> {
  try {
    return JSON.parse(await readFile(recordedPathFor(suitePath, suiteName), 'utf8')) as RecordedVariants;
  } catch {
    return undefined;
  }
}

/** Cases recorded from a sentence they no longer say: run `hearsay gen-variants` again. */
export function staleCases(file: RecordedVariants | undefined, suite: Suite): string[] {
  return suite.cases.filter((c) => file?.cases[c.id] && file.said?.[c.id] !== undefined && file.said[c.id] !== lastSaid(c)).map((c) => c.id);
}

/** Recorded mishearings per case, only where the case still says what was recorded. */
export async function loadRecorded(suitePath: string, suite: Suite): Promise<RecordedVariants['cases']> {
  const file = await readRecorded(suitePath, suite.suite);
  if (!file) return {};
  const stale = new Set(staleCases(file, suite));
  return Object.fromEntries(Object.entries(file.cases).filter(([id]) => !stale.has(id)));
}
