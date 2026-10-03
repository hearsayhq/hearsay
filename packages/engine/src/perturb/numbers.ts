/** Number words, both ways, for perturbations and argument mapping. */
const UNITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** "fifteen" → 15, "forty-two" → 42, "15" → 15; anything else → undefined. */
export function parseNumber(token: string): number | undefined {
  const t = token.toLowerCase().trim();
  if (/^\d+(\.\d+)?$/.test(t)) return Number(t);
  const u = UNITS.indexOf(t);
  if (u >= 0) return u;
  const [tens, unit] = t.split('-');
  const ti = TENS.indexOf(tens ?? '');
  if (ti >= 2) {
    if (unit === undefined) return ti * 10;
    const ui = UNITS.indexOf(unit);
    if (ui > 0 && ui < 10) return ti * 10 + ui;
  }
  return undefined;
}

/** Teen ↔ tens pairs, the classic ASR confusion (thirteen ↔ thirty … nineteen ↔ ninety). */
export const TEEN_TENS: Array<[string, string]> = [3, 4, 5, 6, 7, 8, 9].map((d) => [UNITS[10 + d]!, TENS[d]!]);

/** The words, with numbers, money, percent and "OK" written one way: "Add $15." = "add fifteen dollars". */
export function spokenWords(s: string): string {
  return s
    .toLowerCase()
    .replace(/\$(\d+)/g, '$1 dollars')
    .replace(/(\d+)%/g, '$1 percent')
    .split(/[^a-z0-9'-]+/)
    .filter(Boolean)
    .map((w) => {
      const n = parseNumber(w);
      if (n !== undefined) return String(n);
      return w === 'ok' ? 'okay' : w.replace(/-/g, '');
    })
    .join(' ');
}
