import { randomBytes } from 'node:crypto';

// Lowercase-only alphabet avoids collation ambiguities (e.g. ICU case-insensitive
// equating 'A' with 'a') and keeps rank strings compact under any locale.
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
const RANK_SEPARATOR = '!';

export function generateRank(prev: string | null, next: string | null): string {
  if (prev === null && next === null) {
    return ALPHABET[18]; // 'i' — middle of 36-char alphabet
  }
  if (prev === null) {
    return before(next!);
  }
  if (next === null) {
    return after(prev);
  }
  return between(prev, next);
}

export function generatePosition(rank: string, siteToken: string, sequence: number): string {
  return `${rank}${RANK_SEPARATOR}${siteToken}${RANK_SEPARATOR}${String(sequence).padStart(10, '0')}`;
}

export function generateSiteToken(): string {
  return randomBytes(4).toString('hex');
}

export function extractRank(position: string): string | null {
  if (!position) {
    return null;
  }
  return position.split(RANK_SEPARATOR)[0] ?? null;
}

/**
 * Return a rank string strictly less than `s`.
 *
 * Finds the rightmost character that can be decremented (not '0'),
 * decrements it, and appends a single 'z' to stay close to `s`
 * while avoiding collisions with existing ranks.
 */
function before(s: string): string {
  let i = s.length - 1;
  while (i >= 0 && s[i] === '0') {
    i--;
  }
  if (i < 0) {
    // All '0's — the only value strictly less than s is '0' (a prefix of
    // any longer all-'0' string). Note: there is no string < '0' in this
    // alphabet, so before('0') returns '0' — the caller must avoid pushing
    // ranks this far down (requires ~36+ sequential before() calls).
    return '0';
  }
  const idx = ALPHABET.indexOf(s[i]);
  return s.slice(0, i) + ALPHABET[idx - 1] + 'z';
}

/**
 * Return a rank string strictly greater than `s`.
 *
 * Finds the rightmost character that can be incremented (not 'z'),
 * increments it, and drops trailing 'z's to keep the string as short
 * as possible.
 */
function after(s: string): string {
  let i = s.length - 1;
  while (i >= 0 && s[i] === 'z') {
    i--;
  }
  if (i < 0) {
    return s + ALPHABET[0]; // all 'z's — extend by one minimum character
  }
  const idx = ALPHABET.indexOf(s[i]);
  return s.slice(0, i) + ALPHABET[idx + 1];
}

function between(a: string, b: string): string {
  const maxLen = Math.max(a.length, b.length);
  for (let i = 0; i < maxLen; i++) {
    const ca = i < a.length ? ALPHABET.indexOf(a[i]) : 0;
    const cb = i < b.length ? ALPHABET.indexOf(b[i]) : ALPHABET.length - 1;
    if (ca < cb - 1) {
      // There is room for at least one character between ca and cb.
      // Pad with '0's when a is shorter than the insertion point so the
      // returned rank preserves the common prefix correctly.
      const prefix = a.slice(0, i);
      const padding = i > a.length ? '0'.repeat(i - a.length) : '';
      return prefix + padding + ALPHABET[Math.floor((ca + cb) / 2)] + a.slice(i + 1);
    }
    if (ca !== cb) {
      // Adjacent characters (cb = ca + 1) or ca > cb (stale rank).
      // Append the smallest character plus a midpoint to leave room for
      // future insertions. Without the midpoint, repeatedly inserting
      // between a and a+'0' eventually produces duplicate ranks.
      return a + ALPHABET[0] + ALPHABET[18];
    }
  }
  // a is a prefix of b (all compared characters equal up to maxLen).
  // b's first extending character must be '0' — otherwise the loop
  // would have exited via ca !== cb above.
  if (a.length < b.length) {
    // Extend a with the smallest character plus a midpoint so there
    // is room between a and the result for future insertions.
    return a + ALPHABET[0] + ALPHABET[18];
  }
  // a and b are identical — should not happen for well-ordered inputs.
  return a + ALPHABET[0];
}
