/**
 * 04 · The rules. Replies are graded by the rules Amazon published for add-ons: five tiles that
 * land as each rule is said, each with its own small proof of what it means; then Hearsay's own
 * checks, for budgets and consent, marked as its own.
 */
import type { ReactNode } from 'react';
import { sceneFrames } from '../film5/plan';
import { display, mono, P, QIN, QIO, serif } from './design';
import { Cam, cueOf, HOME, Label, Morph, Place, ramp, Rise, useF, useInk, Words } from './kit';

const w = cueOf('rules');

function Tile({ i, at, glyph, title, children }: { i: number; at: number; glyph: ReactNode; title: string; children?: ReactNode }) {
  const fr = useF();
  const ink = useInk();
  const k = ramp(fr, at - 8, at + 20, 0, 1, QIO);
  const x = 96 + i * 352;
  return (
    <div style={{ position: 'absolute', left: x, top: 330, width: 332, height: 380, borderTop: `3px solid ${ink.fg}`, clipPath: `inset(0 0 ${(1 - k) * 100}% 0)` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontFamily: mono, fontSize: 14, letterSpacing: '0.14em', color: ink.muted }}>
        <span>0{i + 1}</span><span>AMAZON</span>
      </div>
      <div style={{ fontFamily: display, fontSize: 128, fontWeight: 800, letterSpacing: '-0.05em', color: ink.fg, height: 150, marginTop: 10, display: 'flex', alignItems: 'flex-end', lineHeight: 0.9 }}>{glyph}</div>
      <div style={{ fontFamily: display, fontSize: 34, fontWeight: 650, letterSpacing: '-0.02em', lineHeight: 1.08, color: ink.fg, marginTop: 18 }}>{title}</div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>{children}</div>
    </div>
  );
}

/** A bar that fills to a limit and stops. */
function Meter({ at, label, fill = 0.82 }: { at: number; label: string; fill?: number }) {
  const fr = useF();
  const ink = useInk();
  const k = ramp(fr, at, at + 40, 0, fill, QIO);
  return (
    <div>
      <div style={{ position: 'relative', height: 14, border: `2px solid ${ink.fg}` }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${k * 100}%`, background: P.orange }} />
        <div style={{ position: 'absolute', left: '100%', top: -10, bottom: -10, width: 3, background: P.red }} />
      </div>
      <div style={{ fontFamily: mono, fontSize: 15, color: ink.muted, marginTop: 10 }}>{label}</div>
    </div>
  );
}

/** Where the five option squares sit: the next page grows out of them. */
export const FIVE = { x: 1257, y: 693 };

export function Rules() {
  const D = sceneFrames('rules');
  return (
    <>
      <Cam keys={[[0, { x: 960, y: 517, s: 1.05 }], [40, HOME]]}><RulesPage /></Cam>
      {/* Out: an ink square grows from the five options and becomes the night page. */}
      <Morph from={{ x: FIVE.x - 110, y: FIVE.y - 17, w: 220, h: 34 }} to={{ x: -100, y: -100, w: 2120, h: 1280 }} a={D - 24} b={D} fill={P.night} z={9} />
    </>
  );
}

function RulesPage() {
  const fr = useF();
  const ink = useInk();
  const own = w('rules', 35);
  return (
    <>
      <div style={{ position: 'absolute', left: 96, top: 128 }}>
        <Label><Rise at={w('rules', 0)}>replies are graded by</Rise></Label>
        <div style={{ fontFamily: display, fontSize: 92, fontWeight: 800, letterSpacing: '-0.045em', color: ink.fg, marginTop: 10, lineHeight: 1 }}>
          <Words parts={[['the', w('rules', 4)], ['rules', w('rules', 5)], ['Amazon', w('rules', 6)], ['published', w('rules', 7), { fontFamily: serif, fontWeight: 400, color: P.orange, letterSpacing: '-0.01em', fontSize: 104 }], ['for', w('rules', 8)], ['add-ons', w('rules', 9)]]} gap="0.22em" />
        </div>
      </div>
      <Tile i={0} at={w('rules', 10)} glyph={<>½<span style={{ fontSize: 76, marginLeft: 8 }}>s</span></>} title="per tool call">
        <Meter at={w('rules', 10) + 6} label="500 ms, round trip" />
      </Tile>
      <Tile i={1} at={w('rules', 16)} glyph={<><span style={{ fontSize: 76, marginRight: 6 }}>&lt;</span>30<span style={{ fontSize: 76, marginLeft: 6 }}>s</span></>} title="short replies">
        <Meter at={w('rules', 16) + 6} label="to read any reply aloud" fill={0.4} />
      </Tile>
      <Tile i={2} at={w('rules', 18)} glyph={<span style={{ position: 'relative', fontFamily: mono, fontWeight: 500 }}>{'{ }'}<StrikeLine at={w('rules', 19)} /></span>} title="no code read aloud">
        <div style={{ fontFamily: mono, fontSize: 15, color: ink.muted }}>no JSON, no ids, no tool names</div>
      </Tile>
      <Tile i={3} at={w('rules', 22)} glyph={<>5</>} title="options at most">
        <div style={{ display: 'flex', gap: 10 }}>
          {[0, 1, 2, 3, 4, 5].map((n) => {
            const at = w('rules', 22) + 4 + n * 4;
            const k = ramp(fr, at, at + 10);
            return <span key={n} style={{ width: 34, height: 34, background: n < 5 ? ink.fg : 'transparent', border: n < 5 ? 'none' : `2px dashed ${P.red}`, opacity: k, transform: `scale(${0.4 + 0.6 * k})`, color: P.red, fontFamily: mono, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n === 5 ? '✗' : ''}</span>;
          })}
        </div>
      </Tile>
      <Tile i={4} at={w('rules', 27)} glyph={<>$</>} title="no payment without what and how much">
        <div style={{ fontFamily: mono, fontSize: 17, color: ink.fg, lineHeight: 1.5 }}>
          <div style={{ opacity: ramp(fr, w('rules', 31), w('rules', 31) + 8) }}><span style={{ color: P.orange }}>what</span> · 2 cartons of milk</div>
          <div style={{ opacity: ramp(fr, w('rules', 34), w('rules', 34) + 8) }}><span style={{ color: P.orange }}>how much</span> · $7.40</div>
        </div>
      </Tile>
      {/* Hearsay's own: marked as its own. */}
      <div style={{ position: 'absolute', left: 96, top: 760, width: 1728, height: 140, display: 'flex', alignItems: 'center', gap: 34, borderTop: `1px dashed ${ink.fg}`, opacity: ramp(fr, own - 6, own + 14), transform: `translateY(${(1 - ramp(fr, own - 6, own + 26)) * 30}px)` }}>
        <div style={{ fontFamily: display, fontSize: 64, fontWeight: 800, letterSpacing: '-0.04em', color: ink.fg }}>+</div>
        <div>
          <Label color={P.orange}>Hearsay’s own checks</Label>
          <div style={{ fontFamily: display, fontSize: 52, fontWeight: 700, letterSpacing: '-0.03em', color: ink.fg, marginTop: 6 }}>
            <Words parts={[['for', w('rules', 39)], ['budgets', w('rules', 40)], ['and', w('rules', 41)], ['consent', w('rules', 42), { fontFamily: serif, fontWeight: 400, color: P.orange, fontSize: 62 }]]} gap="0.22em" />
          </div>
        </div>
        <Place x={1180} y={30} at={own + 30} dy={10}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontFamily: mono, fontSize: 18, color: ink.fg }}>
            <span style={{ letterSpacing: '0.12em', color: ink.muted }}>EVERY FINDING NAMES ITS SOURCE</span>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            {['amazon-fr', 'mcp-spec', 'hearsay'].map((t, i) => <span key={t} style={{ fontFamily: mono, fontSize: 18, padding: '6px 12px', border: `1.5px solid ${i === 2 ? P.orange : ink.fg}`, color: i === 2 ? P.orange : ink.fg }}>{t}</span>)}
          </div>
        </Place>
      </div>
    </>
  );
}

function StrikeLine({ at }: { at: number }) {
  const fr = useF();
  const k = ramp(fr, at, at + 14, 0, 1, QIO);
  return <span style={{ position: 'absolute', left: '-6%', top: '52%', height: 8, width: `${112 * k}%`, background: P.red, transform: 'rotate(-14deg)', transformOrigin: 'left' }} />;
}
