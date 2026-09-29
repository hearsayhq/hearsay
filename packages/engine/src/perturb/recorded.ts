/**
 * Recorded mishearings for asr.roundtrip (FR-017): `<suite dir>/variants/<suite>.json`,
 * written by `hearsay gen-variants`, committed, replayed without any AWS call.
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export interface RecordedVariants {
  suite: string;
  provenance: { voice: string; provider: string; recordedAt: string; channel: string };
  cases: Record<string, Array<{ heard: string; snrDb: number; seed: number }>>;
}

export const recordedPathFor = (suitePath: string, suiteName: string) => join(dirname(suitePath), 'variants', `${suiteName}.json`);

export async function loadRecorded(suitePath: string, suiteName: string): Promise<RecordedVariants['cases']> {
  try {
    return (JSON.parse(await readFile(recordedPathFor(suitePath, suiteName), 'utf8')) as RecordedVariants).cases;
  } catch {
    return {};
  }
}
