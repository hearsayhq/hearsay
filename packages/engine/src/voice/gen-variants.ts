/**
 * `hearsay gen-variants` (FR-017): speak each asr.roundtrip case in several voices through
 * TTS, a noisy phone line and STT, and keep what was heard in other words. Only new or changed
 * sentences are recorded (`all` records every case again). The file is committed; runs replay
 * it (asr.roundtrip) and never call AWS.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { spokenWords } from '../perturb/numbers';
import { lastSaid, readRecorded, recordedPathFor, type RecordedVariants } from '../perturb/recorded';
import type { Suite } from '../suite';
import { phoneChannel } from './channel';
import type { Stt, Tts } from './aws';

export const DEFAULT_TRIALS = [
  { snrDb: 20, seed: 1 },
  { snrDb: 10, seed: 2 },
  { snrDb: 5, seed: 3 },
];

/** US, US, British and Indian English: one US voice alone hears almost everything right. */
export const DEFAULT_VOICES = ['Joanna', 'Matthew', 'Amy', 'Kajal'];

export interface GenVariantsResult {
  path: string;
  file: RecordedVariants;
  /** Case ids spoken in this call; the others kept their recording. */
  recorded: string[];
}

export async function genVariants(suite: Suite, suitePath: string, voices: Tts[], stt: Stt, opts: { trials?: typeof DEFAULT_TRIALS; all?: boolean } = {}): Promise<GenVariantsResult | undefined> {
  const trials = opts.trials ?? DEFAULT_TRIALS;
  const roundtrip = suite.cases.filter((x) => x.fuzz.includes('asr.roundtrip'));
  if (!roundtrip.length) return undefined;
  const channel = `white noise at ${trials.map((t) => t.snrDb).join('/')} dB SNR, 300–3400 Hz, 8 kHz`;
  const voiceIds = voices.map((v) => v.id);
  const old = await readRecorded(suitePath, suite.suite);
  // A recording only carries over when it was made the same way.
  const sameSetup = old?.said && old.provenance.channel === channel && old.provenance.provider === stt.id && JSON.stringify(old.provenance.voices) === JSON.stringify(voiceIds);
  const file: RecordedVariants = {
    suite: suite.suite,
    provenance: { voices: voiceIds, provider: stt.id, recordedAt: old?.provenance.recordedAt ?? new Date().toISOString(), channel },
    said: {},
    cases: {},
  };
  const recorded: string[] = [];
  for (const c of roundtrip) {
    const said = lastSaid(c);
    file.said![c.id] = said;
    if (!opts.all && sameSetup && old.said![c.id] === said && old.cases[c.id]) {
      file.cases[c.id] = old.cases[c.id]!;
      continue;
    }
    const heard: RecordedVariants['cases'][string] = [];
    for (const tts of voices) {
      const speech = await tts.synthesize(said);
      for (const t of trials) {
        const text = await stt.transcribe(phoneChannel(speech, t));
        if (text && spokenWords(text) !== spokenWords(said) && !heard.some((h) => spokenWords(h.heard) === spokenWords(text))) heard.push({ heard: text, voice: tts.id, snrDb: t.snrDb, seed: t.seed });
      }
    }
    file.cases[c.id] = heard;
    recorded.push(c.id);
  }
  if (recorded.length) file.provenance.recordedAt = new Date().toISOString();
  const path = recordedPathFor(suitePath, suite.suite);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(file, null, 2) + '\n');
  return { path, file, recorded };
}
