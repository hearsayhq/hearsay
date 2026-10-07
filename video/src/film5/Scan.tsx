/**
 * Not just ours: the scan of other Alexa+ add-ons from this hackathon (FR-062, docs/16), as
 * aggregates only. One dot per add-on that started, coloured by its worst finding; servers per
 * question; and what a green run with every submission would save.
 */
import { cue } from './plan';
import { C, Chip, GRAD_TEXT, mono, Pop, ramp, sans, stick, useF } from '../film4/kit';

/** docs/16 (two scan runs, 30 Sep and 7 Oct): the add-on servers that name this hackathon and
 * started, by worst finding. */
export const SCAN = {
  started: 111,
  worst: { error: 19, warn: 87, clean: 5 },
  /** Of the 25 whose read-only tools could be called: replies with JSON, tool names or ids. */
  readAloud: 17,
  questions: [
    { q: 'Did it hear me right?', n: 97 },
    { q: 'Did I agree?', n: 57 },
    { q: 'Can I listen to this?', n: 18 },
    { q: 'Can it connect?', n: 3 },
  ],
} as const;

const TINT = { error: C.red, warn: C.amber, clean: C.green } as const;

export function ScanBeat({ from, colour, total, review }: { from: number; colour: number; total: number; review: number }) {
  const fr = useF();
  const dots = [
    ...Array<'error'>(SCAN.worst.error).fill('error'),
    ...Array<'warn'>(SCAN.worst.warn).fill('warn'),
    ...Array<'clean'>(SCAN.worst.clean).fill('clean'),
  ];
  const fix = SCAN.worst.error + SCAN.worst.warn;
  const perRow = Math.min(20, Math.ceil(dots.length / Math.ceil(dots.length / 20)));
  const size = 34;
  const gap = 12;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Pop at={from} x={960} y={110}><Chip tint={C.amber} solid style={{ fontFamily: sans, fontWeight: 900, fontSize: 24, letterSpacing: 3 }}>NOT JUST OURS</Chip></Pop>
      <Pop at={from + 4} x={960} y={190}>
        <div style={{ fontFamily: sans, fontSize: 60, fontWeight: 900, color: C.text, whiteSpace: 'nowrap', letterSpacing: -1 }}><span style={GRAD_TEXT}>{SCAN.started}</span> Alexa+ add-ons from this hackathon</div>
      </Pop>
      <Pop at={from + 10} x={960} y={262}>
        <div style={{ fontFamily: sans, fontSize: 26, fontWeight: 600, color: C.muted, whiteSpace: 'nowrap' }}>public repos, built and run in containers: no network, no keys, no tests written for them</div>
      </Pop>
      <div style={{ position: 'absolute', left: 960 - (perRow * (size + gap) - gap) / 2, top: 330, width: perRow * (size + gap), display: 'flex', flexWrap: 'wrap', gap }}>
        {dots.map((d, i) => {
          const at = from + 8 + Math.round((i * 24) / dots.length);
          const k = fr >= at ? stick(fr, at, { damping: 14, stiffness: 220 }) : 0;
          const c = ramp(fr, colour + Math.round((i * 12) / dots.length), colour + 8 + Math.round((i * 12) / dots.length));
          const tint = TINT[d];
          return <div key={i} style={{ width: size, height: size, borderRadius: size / 2, transform: `scale(${k})`, background: c > 0 ? `color-mix(in srgb, ${tint} ${Math.round(c * 100)}%, rgba(255,255,255,0.18))` : 'rgba(255,255,255,0.18)', boxShadow: c > 0.5 && d === 'error' ? `0 0 18px ${C.red}` : 'none' }} />;
        })}
      </div>
      <Pop at={total} x={960} y={330 + Math.ceil(dots.length / perRow) * (size + gap) + 70}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 22, whiteSpace: 'nowrap' }}>
          <span style={{ fontFamily: sans, fontSize: 84, fontWeight: 900, color: C.text }}>{fix} of {SCAN.started}</span>
          <span style={{ fontFamily: sans, fontSize: 40, fontWeight: 800, color: C.text }}>had something to fix</span>
          <Chip tint={C.red} style={{ fontSize: 22 }}>{SCAN.worst.error} fail a run</Chip>
          <Chip tint={C.red} style={{ fontSize: 22 }}>{SCAN.readAloud} would read JSON or ids aloud</Chip>
        </div>
      </Pop>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 330 + Math.ceil(dots.length / perRow) * (size + gap) + 150, display: 'flex', justifyContent: 'center', gap: 16 }}>
        {SCAN.questions.map((x, i) => (
          <div key={x.q} style={{ opacity: ramp(fr, total + 10 + i * 4, total + 20 + i * 4) }}>
            <Chip tint={C.text} style={{ fontFamily: sans, fontSize: 22 }}>{x.q} <b style={{ fontFamily: mono, color: C.amber }}>{x.n}</b></Chip>
          </div>
        ))}
      </div>
      <Pop at={review} x={960} y={960} rot={-1}>
        <div style={{ fontFamily: sans, fontSize: 34, fontWeight: 800, color: C.text, padding: '14px 28px', borderRadius: 20, background: 'rgba(10,13,26,0.88)', border: `2px solid ${C.green}`, whiteSpace: 'nowrap' }}>
          A green run with every submission: <span style={{ color: C.green }}>less to review by hand</span>
        </div>
      </Pop>
    </div>
  );
}

const W = (line: string, i: number) => cue('scan', line, i);

/** The scene: the dots come in with the line, take their colour on "all but five". */
export function Scan() {
  return <ScanBeat from={W('scan', 0) - 10} colour={W('scan', 11) - 4} total={W('scan', 11)} review={W('scan', 16) - 4} />;
}
