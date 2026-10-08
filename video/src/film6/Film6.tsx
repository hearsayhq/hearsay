/**
 * Film v6: the same story and voices as v5.3 (src/film5/plan.ts), redrawn as motion design. Paper
 * and ink for the idea, a night bench for the real runs. Every page carries a header, the fine
 * print, and a transcript band that shows who is speaking, the words as they are said, and the
 * voice itself. Pages replace each other behind a playhead line.
 */
import type { ReactNode } from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { f, FILM5_FRAMES, PIECES, POLLY, SCENES, sceneStart } from '../film5/plan';
import { display, INK, mono, P } from './design';
import type { Mode } from './design';
import { Clock, Grain, ModeCtx, useInk } from './kit';
import { ENV, SeqStart, useAbs } from './clock';
import { Case } from './Case';
import { What } from './What';
import { How } from './How';
import { Rules } from './Rules';
import { Scan } from './Scan';
import { After, Ci, Red } from './Demo';
import { Agent, agentFinePrint6, Cheat } from './More';
import { Offer } from './Offer';
import { Sound6 } from './Sound6';

export const FILM6_FRAMES = FILM5_FRAMES;

const VIEWS: Record<string, () => ReactNode> = {
  case: Case, what: What, how: How, rules: Rules, scan: Scan, red: Red, after: After, ci: Ci, agent: Agent, cheat: Cheat, offer: Offer,
};

const MODE: Record<string, Mode> = {
  case: 'paper', what: 'paper', how: 'paper', rules: 'paper', scan: 'night', red: 'night', after: 'night', ci: 'night', agent: 'night', cheat: 'night', offer: 'paper',
};

/** How each page arrives: a playhead sweep from a side, an iris, or a hard cut on the beat. */
type Entry = 'left' | 'right' | 'up' | 'iris' | 'cut';
// Every cut is a hard cut: what carries the eye across is a shape that becomes the next page's
// first shape (each scene's entry and exit, in its own file).
const ENTRY: Record<string, Entry> = {
  what: 'cut', how: 'cut', rules: 'cut', scan: 'cut', red: 'cut', after: 'cut', ci: 'cut', agent: 'cut', cheat: 'cut', offer: 'cut',
};

export const CHAPTER: Record<string, [string, string]> = {
  case: ['01', 'The problem'], what: ['02', 'What it is'], how: ['03', 'How it works'], rules: ['04', 'The rules'], scan: ['05', 'Not just ours'],
  red: ['06', 'A real run'], after: ['06', 'A real run'], ci: ['07', 'On every change'], agent: ['08', 'For coding agents'], cheat: ['08', 'For coding agents'], offer: ['09', 'Try it'],
};

const FINE: Record<string, string> = {
  case: 'Unofficial. Not affiliated with or endorsed by Amazon. Narration is AI-generated; the customer and the add-on speak with Amazon Polly. “Added.” is the flawed demo build’s real reply.',
  what: 'Amazon’s add-on requirements: an MCP server on spec 2025-11-25 or later, over Streamable HTTP. The console: real run, real time, record/console-v5.mjs on the flawed demo build. Hearsay is unofficial and certifies nothing.',
  how: 'By default Hearsay replays the words, the mishearings and the tool call from your test: no microphone, no model, no network. With --orchestrator llm a model (Amazon Bedrock) picks the tool, recorded once and replayed. Recorded mishearings: Amazon Polly through a phone-quality channel into Amazon Transcribe, not Alexa’s own speech recognition.',
  rules: 'From Amazon’s published functional requirements for Alexa+ add-ons; Hearsay’s own checks are marked as its own in every finding. Hearsay checks early; it doesn’t certify anything.',
  scan: 'docs/16, aggregates only, no names: public repos that name this hackathon, pinned to a commit, built and run in containers with no network and no credentials. No tests were written for them: only declared tools and read-only replies were checked.',
  red: 'Real run, one take, real time from the run command on: video/tapes/orders-flawed-4k.tape at main 9b4acdd. Reproduce it: README → Demo.',
  after: 'Real run, real time: video/tapes/orders-fixed-4k.tape, same tests. Both replies are the fixed add-on’s, word for word from its run of these tests, spoken by Amazon Polly.',
  ci: 'Pull request #27, a demo change: runs 36779993236 (red) and 36780493038 (green). Pages from github.com, logged out. The pull request was closed after its two runs.',
  agent: agentFinePrint6,
  cheat: 'Real run, real time from the end of the edit on: video/tapes/cheat-4k.tape.',
  offer: 'Real run, one take, real time: video/tapes/npx-v5.tape, @hearsayhq/cli 0.1.2 from npm in a project folder. Unofficial; not affiliated with or endorsed by Amazon. Narration is AI-generated.',
};


type Chunk = { words: Array<{ word: string; at: number; end: number }>; from: number; to: number; who: 'narrator' | 'customer' | 'add-on' };
const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  for (const p of PIECES) {
    let cur: Chunk['words'] = [];
    const flush = () => { if (cur.length) out.push({ words: cur, from: f(cur[0]!.at) - 4, to: f(cur[cur.length - 1]!.end) + 14, who: 'narrator' }); cur = []; };
    for (const w of p.words) {
      cur.push(w);
      if (/[.?!:]["”]?$/.test(w.word) || (/[,;]$/.test(w.word) && cur.length >= 4) || cur.length >= 8) flush();
    }
    flush();
  }
  for (const p of POLLY) {
    const at = sceneStart(p.scene) + p.at;
    const words = p.text.split(' ');
    const step = p.seconds / words.length;
    out.push({ words: words.map((w, i) => ({ word: w, at: at + i * step, end: at + (i + 1) * step })), from: f(at) - 4, to: f(at + p.seconds) + 16, who: p.who as Chunk['who'] });
  }
  out.sort((a, b) => a.from - b.from);
  for (let i = 0; i < out.length - 1; i++) out[i]!.to = Math.min(out[i]!.to, out[i + 1]!.from);
  return out;
})();


/** Who is speaking, the words as they are said, and the voice: the captions, as an instrument. */
function Band() {
  const abs = useAbs();
  const ink = useInk();
  const c = CHUNKS.find((x) => abs >= x.from && abs < x.to);
  const N = 44;
  const long = c ? c.words.map((w) => w.word).join(' ').length > 64 : false;
  const tc = abs / 60;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 976, height: 104 }}>
      <div style={{ position: 'absolute', left: 64, right: 64, top: 0, height: 1, background: ink.hair }} />
      <div style={{ position: 'absolute', left: 64, top: 40, width: 170, fontFamily: mono, fontSize: 14, fontWeight: 600, letterSpacing: '0.14em', color: c && c.who !== 'narrator' ? P.orange : ink.muted }}>
        {c ? (c.who === 'narrator' ? 'NARRATOR' : c.who === 'customer' ? 'CUSTOMER' : 'ADD-ON') : ''}
        {c && c.who !== 'narrator' ? <div style={{ fontWeight: 400, fontSize: 12, marginTop: 4, color: ink.muted, letterSpacing: '0.1em' }}>AMAZON POLLY</div> : null}
      </div>
      <div style={{ position: 'absolute', left: 250, width: 1290, top: 0, height: 104, display: 'flex', alignItems: 'center' }}>
        {c ? (
          <div style={{ fontFamily: display, fontSize: long ? 27 : 32, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.22, color: ink.fg }}>
            {c.words.map((w, i) => {
              const said = abs >= f(w.at);
              const now = said && abs < f(Math.max(w.end, w.at + 0.2));
              return (
                <span key={i} style={{ color: said ? ink.fg : ink.muted, opacity: said ? 1 : 0.5, boxShadow: now ? `inset 0 -4px 0 ${P.orange}` : 'none' }}>
                  {c.who !== 'narrator' && i === 0 ? '“' : ''}{w.word}{c.who !== 'narrator' && i === c.words.length - 1 ? '”' : ''}{i < c.words.length - 1 ? ' ' : ''}
                </span>
              );
            })}
          </div>
        ) : null}
      </div>
      <div style={{ position: 'absolute', left: 1580, top: 26, width: 200, height: 52, display: 'flex', alignItems: 'center', gap: 2 }}>
        {Array.from({ length: N }, (_, i) => {
          const fr = abs - (N - 1 - i) * 2;
          const n = (ENV.narr[fr] ?? 0) / 100;
          const p = (ENV.polly[fr] ?? 0) / 100;
          const v = Math.max(n, p);
          return <span key={i} style={{ width: 2.5, height: Math.max(2, v * 52), background: p > n ? P.orange : ink.fg, opacity: 0.35 + 0.65 * (i / N) }} />;
        })}
      </div>
      <div style={{ position: 'absolute', right: 64, top: 42, fontFamily: mono, fontSize: 14, color: ink.muted, fontVariantNumeric: 'tabular-nums' }}>
        {`${Math.floor(tc / 60)}:${String(Math.floor(tc % 60)).padStart(2, '0')}`}
      </div>
    </div>
  );
}

function Header({ name }: { name: string }) {
  const ink = useInk();
  const abs = useAbs();
  const [n, title] = CHAPTER[name]!;
  return (
    <>
      <div style={{ position: 'absolute', left: 0, top: 0, height: 4, width: (1920 * abs) / FILM6_FRAMES, background: P.orange }} />
      <div style={{ position: 'absolute', left: 64, top: 30, display: 'flex', alignItems: 'baseline', gap: 14, fontFamily: mono, fontSize: 14, letterSpacing: '0.14em', color: ink.fg }}>
        <span style={{ fontWeight: 600 }}>{n}</span><span style={{ color: ink.muted }}>/</span><span style={{ textTransform: 'uppercase' }}>{title}</span>
      </div>
      <div style={{ position: 'absolute', right: 64, top: 30, fontFamily: mono, fontSize: 14, letterSpacing: '0.14em', color: ink.muted, textTransform: 'uppercase' }}>
        Hearsay <span style={{ opacity: 0.5 }}>—</span> preflight checks for Alexa+ add-ons <span style={{ opacity: 0.5 }}>—</span> unofficial
      </div>
    </>
  );
}

function Fine({ name }: { name: string }) {
  const ink = useInk();
  return <div style={{ position: 'absolute', left: 64, top: 940, width: 1792, fontFamily: mono, fontSize: 11.5, lineHeight: 1.35, color: ink.muted, opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{FINE[name]}</div>;
}

const PRE = 40;
const POST = 30;

/** A page: its ink, its content, and the way it arrives over the page before. */
function Page({ name, from }: { name: string; from: number }) {
  const local = useCurrentFrame() - PRE;
  const entry = ENTRY[name];
  const mode = MODE[name]!;
  const ink = INK[mode];
  const View = VIEWS[name]!;
  // The arrival: centred on the cut, 20 frames, led by an orange playhead line.
  const k = entry && entry !== 'cut' ? Math.max(0, Math.min(1, (local + 12) / 20)) : 1;
  const e = k < 0.5 ? 8 * k ** 4 : 1 - (-2 * k + 2) ** 4 / 2;
  let clip = 'none';
  let line: ReactNode = null;
  if (entry === 'left') { clip = `inset(0 0 0 ${(1 - e) * 100}%)`; line = <div style={{ position: 'absolute', top: 0, bottom: 0, left: (1 - e) * 1920 - 3, width: 6, background: P.orange }} />; }
  if (entry === 'right') { clip = `inset(0 ${(1 - e) * 100}% 0 0)`; line = <div style={{ position: 'absolute', top: 0, bottom: 0, left: e * 1920 - 3, width: 6, background: P.orange }} />; }
  if (entry === 'up') { clip = `inset(${(1 - e) * 100}% 0 0 0)`; line = <div style={{ position: 'absolute', left: 0, right: 0, top: (1 - e) * 1080 - 3, height: 6, background: P.orange }} />; }
  if (entry === 'iris') clip = `circle(${e * 1150}px at 960px 520px)`;
  if (entry === 'cut' && local < 0) return null;
  if (k <= 0) return null;
  return (
    <SeqStart.Provider value={from}>
      <ModeCtx.Provider value={mode}>
        <Clock.Provider value={PRE}>
          {/* Each page is its own stacking context: a scene's floods stay on its page, under the next. */}
          <AbsoluteFill style={{ clipPath: k < 1 ? clip : 'none', isolation: 'isolate', zIndex: 0 }}>
            <AbsoluteFill style={{ background: ink.bg }} />
            <View />
            <Header name={name} />
            <Fine name={name} />
            <Band />
            <Grain opacity={mode === 'paper' ? 0.09 : 0.05} />
          </AbsoluteFill>
          {k < 1 ? line : null}
        </Clock.Provider>
      </ModeCtx.Provider>
    </SeqStart.Provider>
  );
}

export function Film6() {
  return (
    <AbsoluteFill style={{ background: P.paper }}>
      {SCENES.map((s) => {
        const from = f(sceneStart(s.name)) - PRE;
        return (
          <Sequence key={s.name} from={from} durationInFrames={f(s.seconds) + PRE + POST} name={s.name}>
            <Page name={s.name} from={from} />
          </Sequence>
        );
      })}
      {PIECES.map((p, i) => (
        <Sequence key={i} from={f(p.audioAt)} durationInFrames={f(p.trimTo - p.trimFrom) + 2} name={`voice ${p.line}`}>
          <Audio src={staticFile(`voice-ds/v5-${p.line}.wav`)} trimBefore={f(p.trimFrom)} volume={(fr) => Math.min(1, p.trimFrom > 0 ? (fr + 1) / 3 : 1, (f(p.trimTo - p.trimFrom) - fr) / 4)} />
        </Sequence>
      ))}
      {POLLY.map((p) => (
        <Sequence key={p.id} from={f(sceneStart(p.scene) + p.at)} durationInFrames={f(p.seconds) + 6} name={`polly ${p.id}`}>
          <Audio src={staticFile(`voice-ds/${p.id}.wav`)} volume={0.95} />
        </Sequence>
      ))}
      <Sound6 />
    </AbsoluteFill>
  );
}
