/**
 * The flawed grocery add-on, through Hearsay's CLI: the real output of a run against that build
 * (src/data/orders-flawed.txt), scrolling to each finding the narration names, with its source
 * from the run's report.
 */
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import output from '../data/orders-flawed.txt';
import report from '../data/orders-flawed.json';
import { c, sans } from '../theme';
import { linesOf } from './timeline';
import { Card, Sev, Source, Terminal } from './ui';

const L = linesOf('problem');
const P3 = L.p2!.parts![1]!;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ROW = 30;
const rows = [`$ hearsay run suites/household-orders.yaml`, ...(output as string).split('\n').slice(3).filter((l, i, a) => !(l === '' && a[i - 1] === ''))].map((l) => l.replace(/\s{2,}/g, '  ').slice(0, 118));
const find = (s: string) => rows.findIndex((r) => r.includes(s));
const MISHEARD = find('consent.misheard_amount');
const DECLINE = find('consent.decline_holds');
const SUMMARY = find('runs failed');
type F = { checkId: string; source: { kind: string } };
const findings = [...(report.serverFindings as unknown as F[]), ...report.cases.flatMap((x) => x.findings as unknown as F[])];
const sourceOf = (id: string) => findings.find((x) => x.checkId === id)?.source.kind ?? 'hearsay';

function colour(r: string) {
  if (r.startsWith('$')) return c.text;
  if (r.startsWith('✗')) return '#ff8a80';
  if (r.startsWith('!')) return '#f2c14e';
  if (/^(Precondition|Did|Do|Can)/.test(r)) return c.text;
  return '#8b949e';
}

export function Problem() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ease = Easing.bezier(0.45, 0, 0.2, 1);
  const target = f < L.p2!.at ? 0 : f < P3.at ? MISHEARD - 10 : f < L.p4!.at + 60 ? DECLINE - 10 : SUMMARY - 18;
  const from = f < L.p2!.at ? 0 : f < P3.at ? 0 : f < L.p4!.at + 60 ? MISHEARD - 10 : DECLINE - 10;
  const start = f < L.p2!.at ? 0 : f < P3.at ? L.p2!.at : f < L.p4!.at + 60 ? P3.at : L.p4!.at + 60;
  const scroll = interpolate(f, [start, start + 50], [from, target], { ...clamp, easing: ease }) * ROW;
  const typed = Math.floor(interpolate(f, [L.p1!.at, L.p1!.at + 40], [0, rows[0]!.length], clamp));
  const shown = interpolate(f, [L.p1!.at + 45, L.p2!.at], [1, 60], clamp);
  const hl = f >= L.p4!.at + 60 ? -1 : f >= P3.at + 20 ? DECLINE : f >= L.p2!.at + 20 ? MISHEARD : -1;
  const callout = (id: string, at: number, text: string) => {
    const k = spring({ frame: f - at, fps, config: { damping: 16 } });
    return (
      <Card style={{ position: 'absolute', right: 70, top: 300, width: 560, opacity: k, transform: `translateX(${(1 - k) * 60}px)` }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}><Sev level="error" /><span style={{ fontFamily: 'monospace', fontSize: 22 }}>{id}</span></div>
        <div style={{ fontSize: 28, lineHeight: 1.35, marginTop: 14 }}>{text}</div>
        <div style={{ marginTop: 16 }}><Source kind={sourceOf(id)} /></div>
      </Card>
    );
  };
  const end = spring({ frame: f - (L.p4!.at + 70), fps, config: { damping: 14 } });
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', left: 90, top: 110, width: 1180, perspective: 2000 }}>
        <Terminal title="~/hearsay — zsh" style={{ transform: `rotateY(${interpolate(f, [0, 200], [8, 3], clamp)}deg)` }}>
          <div style={{ height: 700, overflow: 'hidden', position: 'relative' }}>
            <div style={{ transform: `translateY(${-scroll}px)` }}>
              {rows.map((r, i) => {
                const text = i === 0 ? r.slice(0, typed) : r;
                const vis = i === 0 ? 1 : interpolate(shown, [i, i + 1], [0, 1], clamp);
                return (
                  <div key={i} style={{ height: ROW, whiteSpace: 'pre', color: colour(r), opacity: vis, fontWeight: /^(Precondition|Did|Do|Can)/.test(r) ? 700 : 400, background: i === hl ? 'rgba(255,170,43,0.18)' : 'transparent', borderRadius: 6, fontSize: 19 }}>
                    {text}
                  </div>
                );
              })}
            </div>
          </div>
        </Terminal>
      </div>
      {f >= L.p2!.at + 20 && f < P3.at + 10 && callout('consent.misheard_amount', L.p2!.at + 20, 'Heard “fifty”, and the add-on took the amount without the person hearing it.')}
      {f >= P3.at + 20 && f < L.p4!.at + 50 && callout('consent.decline_holds', P3.at + 20, 'The person said no, and the order changed anyway.')}
      {f >= L.p4!.at + 60 && (
        <Card style={{ position: 'absolute', right: 70, top: 280, width: 560, opacity: end, transform: `scale(${0.9 + end * 0.1})` }}>
          <div style={{ fontSize: 22, color: c.muted }}>household-orders, flawed build</div>
          <div style={{ fontSize: 48, fontWeight: 800, color: '#ff8a80', marginTop: 8 }}>exit 1</div>
          <div style={{ fontSize: 26, marginTop: 6 }}>20 errors · 8 of 10 runs failed</div>
          <div style={{ fontSize: 24, color: c.muted, marginTop: 14 }}>The pull request fails.</div>
        </Card>
      )}
    </div>
  );
}
