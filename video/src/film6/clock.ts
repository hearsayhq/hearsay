/**
 * The film's own clock inside a page, and the voices' loudness per frame (src/film6/envelope.json,
 * from sound/envelope-v6.ts), so what moves on screen is what you hear.
 */
import { createContext, useContext } from 'react';
import { useCurrentFrame } from 'remotion';
import env from './envelope.json';

/** The absolute frame a page's Sequence starts at. */
export const SeqStart = createContext(0);
/** The absolute frame of the film, inside any page. */
export const useAbs = () => useCurrentFrame() + useContext(SeqStart);

export const ENV = env as { narr: number[]; polly: number[] };
/** Narrator, 0..1. */
export const narrLoud = (frame: number) => (ENV.narr[frame] ?? 0) / 100;
/** The Polly voices (customer, add-on), 0..1. */
export const pollyLoud = (frame: number) => (ENV.polly[frame] ?? 0) / 100;
