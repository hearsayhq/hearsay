/**
 * How it works: four steps, three are Amazon's, one is yours. Hearsay plays speech recognition and
 * the model from the test case (fifteen, and fifty), sends the call to the real server, and checks
 * the reply. The two replies are real runs of the flawed and the fixed build.
 */
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { c, mono, sans } from '../theme';
import { linesOf } from './timeline';
import { Card, Chip, Kicker, Sev } from './ui';

const L = linesOf('how');
const TILES = [
  { n: 1, title: 'Speech becomes text', who: 'Amazon' },
  { n: 2, title: 'The model picks your tool', who: 'Amazon' },
  { n: 3, title: 'Your add-on answers', who: 'You' },
  { n: 4, title: 'The reply is spoken', who: 'Amazon' },
];
const X = (i: number) => 150 + i * 420;

export function How() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const m1 = L.m1!.parts!;
  const m2 = L.m2!.parts!;
  const m3 = L.m3!.parts!;
  const tileAt = [m1[1]!.at, m1[2]!.at, m1[3]!.at, m1[3]!.at + 25];
  const pop = (at: number) => spring({ frame: f - at, fps, config: { damping: 15 } });
  const left = pop(m2[0]!.at);
  const right = pop(m3[0]!.at);
  const yaml = pop(m2[1]!.at);
  const fifty = pop(m2[2]!.at);
  const table = pop(m3[0]!.at + 20);
  const noNet = pop(m3[1]!.at);
  const ci = pop(m3[2]!.at);
  const bracket = (from: number, to: number, label: string, k: number) => (
    <div style={{ position: 'absolute', left: X(from) - 10, width: X(to) - X(from) + 400, top: 150, opacity: k, transform: `translateY(${(1 - k) * -20}px)` }}>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 3, color: c.amber, textAlign: 'center' }}>{label}</div>
      <div style={{ height: 14, marginTop: 8, borderTop: `4px solid ${c.amber}`, borderLeft: `4px solid ${c.amber}`, borderRight: `4px solid ${c.amber}`, borderRadius: '10px 10px 0 0' }} />
    </div>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: sans, color: c.text }}>
      <Kicker style={{ position: 'absolute', left: 150, top: 70, opacity: pop(L.m1!.at) }}>HOW IT WORKS</Kicker>
      {bracket(0, 1, 'HEARSAY PLAYS THIS, FROM YOUR TEST CASE', left)}
      {bracket(3, 3, 'HEARSAY CHECKS THIS', right)}
      {TILES.map((t, i) => {
        const k = pop(tileAt[i]!);
        const yours = t.who === 'You';
        const replaced = (i < 2 && left > 0.5) || (i === 3 && right > 0.5);
        return (
          <div key={t.n} style={{ position: 'absolute', left: X(i), top: 205, width: 380, height: 190, opacity: k * (replaced ? 0.55 : 1), transform: `translateY(${(1 - k) * 30}px)` }}>
            <Card style={{ height: '100%', padding: '22px 26px', border: yours ? `2px solid ${c.amber}` : '1px solid rgba(255,255,255,0.12)', boxShadow: yours ? '0 0 60px rgba(255,170,43,0.25)' : undefined }}>
              <div style={{ fontSize: 20, color: c.muted }}>Step {t.n}</div>
              <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8, lineHeight: 1.15 }}>{t.title}</div>
              <div style={{ fontSize: 22, fontWeight: 600, marginTop: 14, color: yours ? c.amber : c.muted }}>{yours ? 'Your code, really running' : t.who}</div>
            </Card>
          </div>
        );
      })}
      <Card style={{ position: 'absolute', left: 150, top: 470, width: 800, opacity: yaml, transform: `translateY(${(1 - yaml) * 30}px)`, padding: '22px 28px' }}>
        <div style={{ fontSize: 20, color: c.muted }}>suites/grocery.yaml · your test case</div>
        <div style={{ fontFamily: mono, fontSize: 25, lineHeight: 1.6, marginTop: 10 }}>
          <div>- say: add <span style={{ color: c.amber }}>fifteen</span> dollars of fruit</div>
          <div>{'  '}call: orders_stage_cart {'{'} amountUsd: <span style={{ color: c.amber }}>15</span> {'}'}</div>
          <div>{'  '}fuzz: [asr.number_confusion]</div>
        </div>
        <div style={{ marginTop: 14, opacity: fifty, fontFamily: mono, fontSize: 24, color: c.amber }}>+ heard “fifty” → amountUsd: 50</div>
      </Card>
      <Card style={{ position: 'absolute', left: 1000, top: 470, width: 770, opacity: table, transform: `translateY(${(1 - table) * 30}px)`, padding: '22px 28px' }}>
        <div style={{ fontSize: 20, color: c.muted }}>The same call with 50, against two builds</div>
        {[
          { build: 'Flawed build', reply: '“Are you sure?” … “Added.”', ok: false, note: 'consent.misheard_amount' },
          { build: 'Fixed build', reply: '“That would go over the total budget you gave me.”', ok: true, note: 'passes' },
        ].map((r) => (
          <div key={r.build} style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 16 }}>
            <div style={{ width: 150, fontSize: 22, color: c.muted }}>{r.build}</div>
            <div style={{ flex: 1, fontSize: 25 }}>{r.reply}</div>
            {r.ok ? <span style={{ color: c.green, fontSize: 26, fontWeight: 700 }}>✓</span> : <Sev level="error" />}
          </div>
        ))}
      </Card>
      <div style={{ position: 'absolute', left: 150, top: 735, display: 'flex', gap: 14, opacity: noNet }}>
        {['no microphone', 'no model', 'no network'].map((x) => <Chip key={x} style={{ textDecoration: 'none' }}>✕ {x}</Chip>)}
      </div>
      <div style={{ position: 'absolute', left: 150, top: 800, fontSize: 46, fontWeight: 800, letterSpacing: -1, opacity: ci, transform: `translateY(${(1 - ci) * 20}px)` }}>
        The same result every time. <span style={{ color: c.amber }}>So it runs in CI.</span>
      </div>
    </div>
  );
}
