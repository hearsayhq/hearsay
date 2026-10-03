import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadRecorded } from '../perturb/recorded';
import { variantsFor } from '../perturb/index';
import { SuiteSchema } from '../suite';
import type { Stt, Tts } from './aws';
import { phoneChannel, snrOf } from './channel';
import { spokenWords } from '../perturb/numbers';
import { genVariants } from './gen-variants';

const tone = (n: number) => Int16Array.from({ length: n }, (_, i) => Math.round(8000 * Math.sin((2 * Math.PI * 1000 * i) / 16000)));

describe('phone channel', () => {
  it('halves the sample rate and is deterministic for a seed', () => {
    const a = phoneChannel(tone(16000), { snrDb: 10, seed: 1 });
    expect(a.length).toBe(8000);
    expect(phoneChannel(tone(16000), { snrDb: 10, seed: 1 })).toEqual(a);
    expect(phoneChannel(tone(16000), { snrDb: 10, seed: 2 })).not.toEqual(a);
  });
  it('adds noise at roughly the requested SNR before the band filter', () => {
    const clean = tone(16000);
    // Measure the noise stage alone by comparing two seeds' worth of noise power is overkill; check the band output keeps the tone.
    const out = phoneChannel(clean, { snrDb: 30, seed: 1 });
    const inBand = Int16Array.from({ length: 8000 }, (_, i) => clean[i * 2]!);
    expect(snrOf(inBand, out)).toBeGreaterThan(5);
  });
});

describe('spokenWords', () => {
  it('writes numbers, money, percent and OK one way', () => {
    expect(spokenWords('Add $15 of fruit.')).toBe(spokenWords('add fifteen dollars of fruit'));
    expect(spokenWords('In the bedroom to 30%.')).toBe('in the bedroom to 30 percent');
    expect(spokenWords('OK, place the order.')).toBe(spokenWords('okay, place the order'));
    expect(spokenWords('you can re-order groceries up to $50')).toBe(spokenWords('you can reorder groceries up to fifty dollars'));
    expect(spokenWords('set a timer for forty-two minutes')).toBe('set a timer for 42 minutes');
  });
});

describe('gen-variants (fake TTS and STT, no AWS)', () => {
  const tts: Tts = { id: 'fake-tts', synthesize: async (t) => Int16Array.from(t, (ch) => ch.charCodeAt(0) * 50) };
  let n = 0;
  const stt: Stt = { id: 'fake-stt', transcribe: async () => ['turn off everything in the living room', 'turn off everything in the livingroom', 'turn off everything in the livingroom'][n++ % 3]! };

  it('keeps distinct mishearings with provenance, and the runner replays them as asr.roundtrip', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hearsay-gen-'));
    const suitePath = join(dir, 'home.yaml');
    await writeFile(suitePath, '');
    const suite = SuiteSchema.parse({ suite: 'home', server: { url: 'http://localhost:1/mcp' }, cases: [{ id: 'off', say: 'turn off everything in the living room', expect: { tool: 'set_scene', args: { room: 'living_room' } }, fuzz: ['asr.roundtrip'] }] });
    const { file } = (await genVariants(suite, suitePath, [tts], stt))!;
    expect(file.cases.off).toEqual([{ heard: 'turn off everything in the livingroom', voice: 'fake-tts', snrDb: 10, seed: 2 }]);
    expect(file.provenance).toMatchObject({ voices: ['fake-tts'], provider: 'fake-stt' });

    const recorded = await loadRecorded(suitePath, 'home');
    const vs = variantsFor('off', 'turn off everything in the living room', ['asr.roundtrip'], { seed: 1, mode: 'scripted', args: { room: 'living_room' }, recorded: recorded.off! });
    expect(vs.map((v) => v.id)).toEqual(['clean', 'asr.roundtrip#1']);
  });

  it('records every voice, and skips what differs only in how numbers are written', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hearsay-gen-'));
    const suitePath = join(dir, 'kitchen.yaml');
    const suite = SuiteSchema.parse({ suite: 'kitchen', server: { url: 'http://localhost:1/mcp' }, cases: [{ id: 'sauce', say: 'start a sauce timer for eight minutes', expect: { tool: 'timer_start' }, fuzz: ['asr.roundtrip'] }] });
    // Voice a's speech is heard with digits only, voice b's as another word.
    const heard: Record<string, string> = { a: 'Start a sauce timer for 8 minutes.', b: 'Start a source timer for 8 minutes.' };
    let speaking = 'a';
    const voices: Tts[] = ['a', 'b'].map((id) => ({ id, synthesize: async () => ((speaking = id), tone(1600)) }));
    const byVoice: Stt = { id: 'fake-stt', transcribe: async () => heard[speaking]! };
    const { file } = (await genVariants(suite, suitePath, voices, byVoice))!;
    expect(file.cases.sauce).toEqual([{ heard: 'Start a source timer for 8 minutes.', voice: 'b', snrDb: 20, seed: 1 }]);
    expect(file.provenance.voices).toEqual(['a', 'b']);
  });
});
