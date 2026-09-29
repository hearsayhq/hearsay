/**
 * The two AWS services behind `hearsay gen-variants` (FR-017): Polly speaks, Transcribe
 * Streaming hears (PCM in, no S3). Only gen-variants calls them; runs replay the file.
 */
import { PollyClient, SynthesizeSpeechCommand, type VoiceId } from '@aws-sdk/client-polly';
import { StartStreamTranscriptionCommand, TranscribeStreamingClient } from '@aws-sdk/client-transcribe-streaming';
import { IN_RATE, OUT_RATE } from './channel';

export interface Tts {
  readonly id: string;
  synthesize(text: string): Promise<Int16Array>;
}

export interface Stt {
  readonly id: string;
  transcribe(pcm8k: Int16Array): Promise<string>;
}

export class PollyTts implements Tts {
  readonly id: string;
  private client: PollyClient;
  constructor(private voice = process.env.HEARSAY_POLLY_VOICE ?? 'Joanna', region = process.env.AWS_REGION ?? 'us-east-1') {
    this.id = `polly:${voice}`;
    this.client = new PollyClient({ region });
  }
  async synthesize(text: string): Promise<Int16Array> {
    const out = await this.client.send(new SynthesizeSpeechCommand({ Text: text, VoiceId: this.voice as VoiceId, OutputFormat: 'pcm', SampleRate: String(IN_RATE), Engine: 'neural' }));
    const bytes = await out.AudioStream!.transformToByteArray();
    return new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
  }
}

export class TranscribeStt implements Stt {
  readonly id = 'transcribe-streaming:en-US';
  private client: TranscribeStreamingClient;
  constructor(region = process.env.AWS_REGION ?? 'us-east-1') {
    this.client = new TranscribeStreamingClient({ region });
  }
  async transcribe(pcm8k: Int16Array): Promise<string> {
    const bytes = new Uint8Array(pcm8k.buffer, pcm8k.byteOffset, pcm8k.byteLength);
    const chunk = (OUT_RATE / 10) * 2; // 100 ms of 16-bit audio
    async function* audio() {
      for (let i = 0; i < bytes.length; i += chunk) yield { AudioEvent: { AudioChunk: bytes.subarray(i, i + chunk) } };
    }
    const res = await this.client.send(new StartStreamTranscriptionCommand({ LanguageCode: 'en-US', MediaEncoding: 'pcm', MediaSampleRateHertz: OUT_RATE, AudioStream: audio() }));
    const parts: string[] = [];
    for await (const ev of res.TranscriptResultStream ?? [])
      for (const r of ev.TranscriptEvent?.Transcript?.Results ?? []) if (!r.IsPartial && r.Alternatives?.[0]?.Transcript) parts.push(r.Alternatives[0].Transcript);
    return parts.join(' ').trim();
  }
}
