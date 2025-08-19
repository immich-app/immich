/**
 * AutoStack shared utilities.
 * Keep behavior stable; these helpers centralize math and parsing used across service and scoring.
 */

/** Euclidean norm (L2). Returns 0 for empty vectors. */
export function norm(v: number[]): number {
  if (!Array.isArray(v) || v.length === 0) {
    return 0;
  }
  let s = 0;
  for (let i = 0; i < v.length; i++) {
    s += v[i] * v[i];
  }
  return Math.sqrt(s);
}

/** Cosine similarity mapped from [-1,1] to [0,1]. Returns 0 if either vector has zero norm. */
export function cosSim01(a: number[], b: number[]): number {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) {
    return 0;
  }
  let dot = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
  }
  const cos = dot / (na * nb);
  return (cos + 1) / 2;
}

const nibbles = (ch: string) => Number.parseInt(ch, 16);

/**
 * Hamming distance between two 16-character hex pHashes (64-bit).
 * Returns a number in [0, 64]. If inputs are invalid, returns +Infinity.
 */
export function hammingHex64(a?: string | null, b?: string | null): number {
  if (!a || !b) {
    return Number.POSITIVE_INFINITY;
  }
  const A = a.toLowerCase();
  const B = b.toLowerCase();
  if (!/^[0-9a-f]{16}$/.test(A) || !/^[0-9a-f]{16}$/.test(B)) {
    return Number.POSITIVE_INFINITY;
  }

  try {
    // Use BigInt popcount for speed and consistency
    // 16 hex chars = 64 bits
    const x = BigInt('0x' + A) ^ BigInt('0x' + B);
    let c = 0n;
    let y = x;
    // Kernighan popcount
    while (y) {
      y &= y - 1n;
      c++;
    }
    return Number(c);
  } catch {
    // Fallback: nibble-wise popcount
    let bits = 0;
    for (let i = 0; i < 16; i++) {
      const v = nibbles(A[i]) ^ nibbles(B[i]);
      bits += (v & 1) + ((v >> 1) & 1) + ((v >> 2) & 1) + ((v >> 3) & 1);
    }
    return bits;
  }
}

/** Extract trailing numeric suffix before extension (e.g., IMG_0123.jpg -> 123). Returns null if none. */
export function extractNumericSuffix(fileName: string): number | null {
  const m = fileName.match(/(\d+)(?=\.[^.]+$)/);
  if (!m) {
    return null;
  }
  const n = Number.parseInt(m[1]);
  return Number.isNaN(n) ? null : n;
}
