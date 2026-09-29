/**
 * Numbers and money as words, so a reply reads the same aloud as on screen and a
 * misheard value is read back unambiguously ("fifteen", not "15").
 */
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function under1000(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const rest = r < 20 ? ONES[r]! : TENS[Math.floor(r / 10)]! + (r % 10 ? `-${ONES[r % 10]}` : '');
  if (!h) return rest;
  return `${ONES[h]} hundred${r ? ` ${rest}` : ''}`;
}

/** Whole numbers from 0 to 999,999 in words. */
export function words(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 999_999) throw new RangeError(`words() supports 0–999999, got ${n}`);
  if (n < 1000) return under1000(n);
  const t = Math.floor(n / 1000);
  const r = n % 1000;
  return `${under1000(t)} thousand${r ? ` ${under1000(r)}` : ''}`;
}

/** Minor units as spoken US dollars: 740 → "seven dollars and forty cents". */
export function money(amountMinor: number): string {
  const d = Math.floor(amountMinor / 100);
  const c = amountMinor % 100;
  const dollars = `${words(d)} dollar${d === 1 ? '' : 's'}`;
  if (!c) return dollars;
  return `${d ? `${dollars} and ` : ''}${words(c)} cent${c === 1 ? '' : 's'}`;
}

/** Count + noun: (2, 'timer') → "two timers". */
export const count = (n: number, noun: string): string => `${words(n)} ${noun}${n === 1 ? '' : 's'}`;
