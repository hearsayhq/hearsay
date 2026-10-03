/**
 * `hearsay gen-variants` (FR-017): speak each asr.roundtrip case in several voices through
 * TTS, a noisy phone line and STT, and keep what was heard in other words. The file is
 * committed; runs replay it (asr.roundtrip) and never call AWS.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { spokenWords } from '../perturb/numbers';
import { recordedPathFor, type RecordedVariants } from '../perturb/recorded';
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

export async function genVariants(suite: Suite, suitePath: string, voices: Tts[], stt: Stt, trials = DEFAULT_TRIALS): Promise<{ path: string; file: RecordedVariants } | undefined> {
  const roundtrip = suite.cases.filter((x) => x.fuzz.includes('asr.roundtrip'));
  if (!roundtrip.length) return undefined;
  const file: RecordedVariants = {
    suite: suite.suite,
    provenance: { voices: voices.map((v) => v.id), provider: stt.id, recordedAt: new Date().toISOString(), channel: `white noise at ${trials.map((t) => t.snrDb).join('/')} dB SNR, 300–3400 Hz, 8 kHz` },
    cases: {},
  };
  for (const c of roundtrip) {
    const said = Array.isArray(c.say) ? c.say.at(-1)! : c.say;
    const heard: RecordedVariants['cases'][string] = [];
    for (const tts of voices) {
      const speech = await tts.synthesize(said);
      for (const t of trials) {
        const text = await stt.transcribe(phoneChannel(speech, t));
        if (text && spokenWords(text) !== spokenWords(said) && !heard.some((h) => spokenWords(h.heard) === spokenWords(text))) heard.push({ heard: text, voice: tts.id, snrDb: t.snrDb, seed: t.seed });
      }
    }
    file.cases[c.id] = heard;
  }
  const path = recordedPathFor(suitePath, suite.suite);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(file, null, 2) + '\n');
  return { path, file };
}
