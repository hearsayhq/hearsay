/**
 * Film v6's look: printed, not glowing. Warm paper and ink for the idea, a night bench for the
 * real runs, one signal orange for the voice and what was heard, red and green only for verdicts.
 * A tight grotesk for statements, a serif italic for the spoken word, a mono for anything a machine
 * says. No gradients, no glow, no Amazon marks.
 */
import { loadFont as loadTight } from '@remotion/google-fonts/InterTight';
import { loadFont as loadSerif } from '@remotion/google-fonts/InstrumentSerif';
import { loadFont as loadMono } from '@remotion/google-fonts/GeistMono';
import { Easing } from 'remotion';

export const display = loadTight('normal', { weights: ['400', '500', '600', '700', '800', '900'], subsets: ['latin'] }).fontFamily;
export const serif = loadSerif('italic', { weights: ['400'], subsets: ['latin'] }).fontFamily;
export const mono = loadMono('normal', { weights: ['400', '500', '600'], subsets: ['latin'] }).fontFamily;

export const P = {
  paper: '#ECE8DF',
  paperDeep: '#E2DDD1',
  ink: '#121211',
  graphite: '#6E6A61',
  hair: 'rgba(18,18,17,0.14)',
  night: '#0E0E0D',
  nightRaise: '#191917',
  nightText: '#ECE8DF',
  nightMuted: '#8D897F',
  nightHair: 'rgba(236,232,223,0.14)',
  orange: '#FF4D12',
  red: '#E5372B',
  green: '#14955D',
  greenBright: '#2CC07A',
} as const;

export type Mode = 'paper' | 'night';
export const INK: Record<Mode, { bg: string; fg: string; muted: string; hair: string; raise: string }> = {
  paper: { bg: P.paper, fg: P.ink, muted: P.graphite, hair: P.hair, raise: P.paperDeep },
  night: { bg: P.night, fg: P.nightText, muted: P.nightMuted, hair: P.nightHair, raise: P.nightRaise },
};

/** Fast in, long settle: every entrance. */
export const EXPO = Easing.bezier(0.16, 1, 0.3, 1);
/** Symmetric, for moves and wipes. */
export const QIO = Easing.bezier(0.76, 0, 0.24, 1);
/** Accelerating, for exits. */
export const QIN = Easing.bezier(0.5, 0, 0.75, 0);

export const FPS = 60;
export const W = 1920;
export const H = 1080;
/** The stage between the header and the transcript band. */
export const STAGE = { top: 76, bottom: 958 } as const;
