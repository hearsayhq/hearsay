/**
 * The README's two images in film v6's look: printed paper, ink, one signal orange, the crash-test
 * mark. Same content as the v4-style ones (src/readme/): an illustration of the idea (said, heard,
 * the check that fails) and how a run works, not product output.
 *   npx remotion still src/index.ts Banner6 ../docs/assets/banner.jpg --image-format=jpeg --jpeg-quality=90
 *   npx remotion still src/index.ts How6 ../docs/assets/how-it-works.jpg --image-format=jpeg --jpeg-quality=90
 */
import type { ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import { display, mono, P, serif } from '../film6/design';
import { Target } from '../film6/kit';

export const BANNER6 = { width: 2400, height: 800 } as const;
export const HOW6 = { width: 2400, height: 900 } as const;

/** Paper with a fine grain, so it reads as printed. */
function Paper({ w, h }: { w: number; h: number }) {
  return (
    <>
      <AbsoluteFill style={{ background: P.paper }} />
      <svg width={w} height={h} style={{ position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: 0.09 }}>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={7} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width={w} height={h} filter="url(#grain)" />
      </svg>
    </>
  );
}

const Tag = ({ children, color = P.graphite }: { children: ReactNode; color?: string }) => (
  <div style={{ fontFamily: mono, fontSize: 22, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color }}>{children}</div>
);

export function Banner6() {
  return (
    <AbsoluteFill>
      <Paper w={BANNER6.width} h={BANNER6.height} />
      <div style={{ position: 'absolute', left: 140, top: 150 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <Target size={170} a={P.ink} />
          <div style={{ fontFamily: display, fontWeight: 900, fontSize: 200, letterSpacing: '-0.05em', lineHeight: 0.9, color: P.ink }}>HEARSAY</div>
        </div>
        <div style={{ fontFamily: display, fontWeight: 700, fontSize: 56, letterSpacing: '-0.03em', color: P.ink, marginTop: 56 }}>Preflight checks for Alexa+ MCP servers</div>
        <div style={{ fontFamily: serif, fontSize: 66, color: P.orange, marginTop: 6 }}>Hear it before your customers do.</div>
        <div style={{ marginTop: 40 }}><Tag>Unofficial · not affiliated with or endorsed by Amazon</Tag></div>
      </div>
      <div style={{ position: 'absolute', left: 1440, top: 160, width: 820, padding: '46px 52px', background: P.night, boxShadow: '0 50px 90px -30px rgba(40,30,10,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 34 }}>
          <div style={{ width: 120 }}><Tag color={P.nightMuted}>said</Tag></div>
          <div style={{ fontFamily: display, fontSize: 54, fontWeight: 600, letterSpacing: '-0.02em', color: P.nightText }}>add fifteen dollars</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 34, marginTop: 22 }}>
          <div style={{ width: 120 }}><Tag color={P.orange}>heard</Tag></div>
          <div style={{ fontFamily: display, fontSize: 54, fontWeight: 600, letterSpacing: '-0.02em', color: P.nightText }}>
            add <span style={{ background: P.orange, color: '#fff', padding: '0 10px' }}>fifty</span> dollars
          </div>
        </div>
        <div style={{ height: 1, background: P.nightHair, margin: '40px 0 34px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <span style={{ width: 52, height: 52, background: P.red, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono, fontSize: 32, fontWeight: 600 }}>✗</span>
          <span style={{ fontFamily: mono, fontSize: 40, color: P.nightText }}>consent.misheard_amount</span>
        </div>
        <div style={{ fontFamily: display, fontSize: 32, fontWeight: 500, lineHeight: 1.3, color: P.nightMuted, marginTop: 22 }}>Took the misheard amount without reading it back. The pull request turns red.</div>
      </div>
    </AbsoluteFill>
  );
}

const XS = [100, 660, 1220, 1780];
const SY = 230;
const SW = 500;
const SH = 300;

function Station({ i, n, title, children }: { i: number; n: string; title: string; children: ReactNode }) {
  return (
    <div style={{ position: 'absolute', left: XS[i], top: SY, width: SW, height: SH, border: `2.5px solid ${P.ink}`, background: P.paperDeep, padding: '28px 32px', boxSizing: 'border-box' }}>
      <Tag>{n}</Tag>
      <div style={{ fontFamily: display, fontSize: 50, fontWeight: 750, letterSpacing: '-0.03em', color: P.ink, marginTop: 16 }}>{title}</div>
      <div style={{ position: 'absolute', left: 32, right: 32, bottom: 30, fontFamily: mono, fontSize: 28, lineHeight: 1.45, color: P.ink }}>{children}</div>
    </div>
  );
}

function Frame({ from, to, label }: { from: number; to: number; label: string }) {
  const left = XS[from]! - 26;
  const width = XS[to]! + SW - XS[from]! + 52;
  return (
    <>
      <div style={{ position: 'absolute', left, top: SY - 26, width, height: SH + 52, border: `5px solid ${P.orange}`, boxSizing: 'border-box' }} />
      <div style={{ position: 'absolute', left, top: SY - 74, background: P.orange, color: '#fff', fontFamily: mono, fontSize: 22, fontWeight: 600, letterSpacing: '0.14em', padding: '10px 16px' }}>{label}</div>
    </>
  );
}

export function How6() {
  return (
    <AbsoluteFill>
      <Paper w={HOW6.width} h={HOW6.height} />
      <div style={{ position: 'absolute', left: 100, top: 70 }}><Tag>how it works</Tag></div>
      <Frame from={0} to={1} label="HEARSAY PLAYS THIS, FROM YOUR TEST CASE" />
      <Frame from={3} to={3} label="HEARSAY CHECKS THIS" />
      {[0, 1, 2].map((i) => (
        <svg key={i} width={60} height={30} style={{ position: 'absolute', left: XS[i]! + SW + 15, top: SY + SH / 2 - 15 }}>
          <path d="M 2 15 L 54 15 M 42 5 L 54 15 L 42 25" stroke={P.ink} strokeWidth={3} fill="none" />
        </svg>
      ))}
      <Station i={0} n="01" title="Speech → text">said fifteen dollars<br /><span style={{ color: P.orange }}>heard fifty dollars</span></Station>
      <Station i={1} n="02" title="Model picks a tool">orders_stage_cart<br />{'{ amountUsd: '}<span style={{ color: P.orange }}>50</span>{' }'}</Station>
      <Station i={2} n="03" title="Your server">your MCP server,<br />unchanged</Station>
      <div style={{ position: 'absolute', left: XS[2], top: SY + SH + 22, width: SW, display: 'flex', justifyContent: 'center' }}>
        <span style={{ background: P.ink, color: P.paper, fontFamily: mono, fontSize: 22, letterSpacing: '0.14em', padding: '8px 16px' }}>YOUR CODE</span>
      </div>
      <Station i={3} n="04" title="Reply, spoken">“Added.”<br /><span style={{ color: P.red }}>✗ consent.misheard_amount</span></Station>
      <div style={{ position: 'absolute', left: 100, right: 100, top: 740, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: display, fontSize: 40, fontWeight: 600, letterSpacing: '-0.02em', color: P.ink }}>Every reply is graded by four questions; any error exits 1 and the pull request turns red.</div>
        <div style={{ display: 'flex', gap: 14 }}>
          {['no microphone', 'no model', 'no API keys'].map((t) => <span key={t} style={{ fontFamily: mono, fontSize: 22, color: P.ink, border: `2px solid ${P.ink}`, padding: '8px 14px', whiteSpace: 'nowrap' }}>{t}</span>)}
        </div>
      </div>
    </AbsoluteFill>
  );
}
