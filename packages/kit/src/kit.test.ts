import { describe, expect, it } from 'vitest';
import { assertSpeakable, count, list, money, refuse, speak, words } from './index';

describe('words and money', () => {
  it.each([
    [0, 'zero'], [7, 'seven'], [15, 'fifteen'], [50, 'fifty'], [42, 'forty-two'], [240, 'two hundred forty'], [1300, 'one thousand three hundred'],
  ])('%i → %s', (n, w) => expect(words(n)).toBe(w));
  it('reads cents', () => expect(money(740)).toBe('seven dollars and forty cents'));
  it('reads whole dollars', () => expect(money(5000)).toBe('fifty dollars'));
  it('reads a single cent', () => expect(money(1)).toBe('one cent'));
  it('counts', () => expect(count(2, 'timer')).toBe('two timers'));
});

describe('speak', () => {
  it('rejects JSON, URLs, ids and snake_case', () => {
    for (const bad of ['{"a":1}', 'see https://x.io', 'id 123e4567-e89b-12d3-a456-426614174000', 'call timer_start'])
      expect(() => assertSpeakable(bad)).toThrow(/Not speakable/);
  });
  it('rejects replies over 30 seconds', () => expect(() => assertSpeakable('word '.repeat(90))).toThrow(/characters/));
  it('keeps structure out of the text', () =>
    expect(speak('Pasta timer set.', { id: 't1' })).toEqual({ content: [{ type: 'text', text: 'Pasta timer set.' }], structuredContent: { id: 't1' } }));
  it('caps lists and offers more', () => {
    expect(list(['pasta', 'egg'])).toBe('pasta and egg');
    expect(list(['a', 'b', 'c', 'd'])).toBe('a, b, and c. Want to hear more?');
    expect(list(['a', 'b', 'c', 'd', 'e', 'f', 'g'], { max: 9 })).toContain('e. Want');
  });
});

describe('refuse', () => {
  it('is an isError result with a code', () =>
    expect(refuse("That item isn't on the list you allowed.", 'OUT_OF_SCOPE')).toMatchObject({ isError: true, structuredContent: { code: 'OUT_OF_SCOPE' } }));
  it('stays one short sentence', () => expect(() => refuse('word '.repeat(45))).toThrow(/too long/));
});
