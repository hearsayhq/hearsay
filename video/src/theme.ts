/**
 * A nod to Amazon, modernized, with no Amazon marks (CLAUDE.md: "for Alexa+", "unofficial"):
 * deep ink navy, one warm amber accent, white type. No logos, no Amazon Ember, no light ring.
 */
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';

export const sans = loadInter('normal', { weights: ['400', '500', '600', '800'], subsets: ['latin'] }).fontFamily;
export const mono = loadMono('normal', { weights: ['400', '500'], subsets: ['latin'] }).fontFamily;

export const c = {
  ink: '#0A1020',
  ink2: '#101A30',
  ink3: '#18233D',
  line: 'rgba(255,255,255,0.10)',
  text: '#F4F6FA',
  muted: '#8B95A9',
  amber: '#FFAA2B',
  amberSoft: 'rgba(255,170,43,0.16)',
  green: '#3DDC97',
  red: '#FF5E5B',
} as const;

export const FPS = 60;
export const W = 1920;
export const H = 1080;
