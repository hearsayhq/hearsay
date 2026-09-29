/**
 * Loose value matching for expectations (docs/03 §Expectations): case and
 * whitespace in strings, number types ("15" = 15), subset match for objects.
 */
const norm = (v: unknown): unknown => {
  if (typeof v === 'string') {
    const s = v.trim().replace(/\s+/g, ' ').toLowerCase();
    return s !== '' && !Number.isNaN(Number(s)) ? Number(s) : s;
  }
  return v;
};

export function looseEqual(actual: unknown, expected: unknown): boolean {
  if (expected !== null && typeof expected === 'object') {
    if (Array.isArray(expected))
      return Array.isArray(actual) && actual.length === expected.length && expected.every((e, i) => looseEqual(actual[i], e));
    return isSubset(actual, expected as Record<string, unknown>);
  }
  return norm(actual) === norm(expected);
}

/** Every key in `expected` is present in `actual` with a loosely equal value. */
export function isSubset(actual: unknown, expected: Record<string, unknown>): boolean {
  if (actual === null || typeof actual !== 'object' || Array.isArray(actual)) return false;
  const a = actual as Record<string, unknown>;
  return Object.entries(expected).every(([k, v]) => k in a && looseEqual(a[k], v));
}

/** Keys of `forbidden` whose value appears in `args`. */
export function forbiddenHits(args: Record<string, unknown>, forbidden: Record<string, unknown>): string[] {
  return Object.entries(forbidden).filter(([k, v]) => k in args && looseEqual(args[k], v)).map(([k]) => k);
}
