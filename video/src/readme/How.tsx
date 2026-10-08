/**
 * The README's "How it works": film v4's diagram as one still.
 * Replaced in docs/assets by film v6's look (src/readme6, 8 Oct); kept for v4's film. Only the server is your code;
 * Hearsay plays the steps around it from the test case and checks the reply.
 *   npx remotion still src/index.ts How ../docs/assets/how-it-works.jpg --image-format=jpeg --jpeg-quality=90
 */
import type { ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import { C, Chip, GLASS, GRAD, Icon, mono, sans } from '../film4/kit';
import { Backdrop } from './Banner';

export const HOW = { width: 2400, height: 900 } as const;

const CARD = { w: 470, h: 300, top: 250 };
const X = [100, 676, 1252, 1828];

function Card({ i, icon, title, glow, children }: { i: number; icon: string; title: string; glow?: string; children: ReactNode }) {
  return (
    <div style={{ ...GLASS, position: 'absolute', left: X[i], top: CARD.top, width: CARD.w, height: CARD.h, borderRadius: 30, padding: '38px 40px', display: 'flex', flexDirection: 'column', gap: 18, border: glow ? `3px solid ${glow}` : GLASS.border, boxShadow: glow ? `0 0 70px ${glow}66, ${GLASS.boxShadow}` : GLASS.boxShadow }}>
      <div style={{ flexShrink: 0 }}><Icon name={icon} size={52} color={glow ?? C.text} /></div>
      <div style={{ flexShrink: 0, fontFamily: sans, fontSize: 42, fontWeight: 800, whiteSpace: 'nowrap', color: C.text, letterSpacing: -0.5 }}>{title}</div>
      <div style={{ flexShrink: 0, fontFamily: mono, fontSize: 27, lineHeight: 1.45, color: C.muted, whiteSpace: 'nowrap' }}>{children}</div>
    </div>
  );
}

const Arrow = ({ i }: { i: number }) => {
  const x = X[i]! + CARD.w + 18;
  return (
    <svg style={{ position: 'absolute', left: x, top: CARD.top + CARD.h / 2 - 20 }} width={70} height={40} viewBox="0 0 70 40">
      <path d="M2 20h60M48 6l14 14-14 14" fill="none" stroke="rgba(244,246,250,0.55)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/** A gradient outline around the steps Hearsay takes over, with its label on the top edge. */
const Sleeve = ({ from, to, label }: { from: number; to: number; label: string }) => {
  const left = X[from]! - 34;
  const width = X[to]! + CARD.w + 34 - left;
  return (
    <>
      <div style={{ position: 'absolute', left, top: CARD.top - 40, width, height: CARD.h + 80, borderRadius: 44, padding: 3, background: GRAD, WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />
      <div style={{ position: 'absolute', left: left + width / 2, top: CARD.top - 40, transform: 'translate(-50%,-50%)', background: GRAD, borderRadius: 999, padding: '12px 30px', fontFamily: sans, fontSize: 30, fontWeight: 800, color: C.ink0, whiteSpace: 'nowrap' }}>{label}</div>
    </>
  );
};

const Under = ({ i, children, tint }: { i: number; children: string; tint: string }) => (
  <div style={{ position: 'absolute', left: X[i]! + CARD.w / 2, top: CARD.top + CARD.h + 76, transform: 'translateX(-50%)' }}>
    <Chip tint={tint} solid={tint === C.blue} style={{ fontFamily: sans, fontWeight: 800, fontSize: 26 }}>{children}</Chip>
  </div>
);

export function How() {
  return (
    <AbsoluteFill style={{ background: '#05060C', overflow: 'hidden' }}>
      <Backdrop />
      <div style={{ position: 'absolute', left: 100, top: 70, fontFamily: mono, fontSize: 28, letterSpacing: 6, color: C.muted }}>HOW IT WORKS</div>

      <Sleeve from={0} to={1} label="Hearsay plays this, from your test case" />
      <Sleeve from={3} to={3} label="Hearsay checks this" />
      <Card i={0} icon="mic" title="Speech → text">
        said <span style={{ color: C.text }}>fifteen dollars</span>
        <br />
        heard <span style={{ color: C.amber }}>fifty dollars</span>
      </Card>
      <Arrow i={0} />
      <Card i={1} icon="model" title="Model picks a tool">
        orders_stage_cart
        <br />
        {'{ amountUsd: '}<span style={{ color: C.amber }}>50</span>{' }'}
      </Card>
      <Arrow i={1} />
      <Card i={2} icon="server" title="Your server" glow={C.blue}>
        your MCP server,
        <br />
        unchanged
      </Card>
      <Arrow i={2} />
      <Card i={3} icon="speaker" title="Reply, spoken">
        “Added.”
        <br />
        <span style={{ color: C.red }}>✗ consent.misheard_amount</span>
      </Card>
      <Under i={2} tint={C.blue}>your code</Under>

      <div style={{ position: 'absolute', left: 100, right: 100, top: 760, display: 'flex', alignItems: 'center', gap: 22, fontFamily: sans, fontSize: 32, fontWeight: 600, color: C.text }}>
        <span>Every reply is graded by four questions; any error exits 1 and the pull request turns red.</span>
        <span style={{ flex: 1 }} />
        {['no microphone', 'no model', 'no API keys'].map((t) => (
          <Chip key={t} tint={C.green} style={{ fontFamily: sans, fontWeight: 700, fontSize: 24 }}>{t}</Chip>
        ))}
      </div>
    </AbsoluteFill>
  );
}
