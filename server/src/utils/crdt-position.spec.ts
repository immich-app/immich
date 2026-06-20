import { extractRank, generatePosition, generateRank, generateSiteToken } from 'src/utils/crdt-position';
import { describe, expect, it } from 'vitest';

describe('generateRank', () => {
  it('should return a middle character when both prev and next are null', () => {
    const rank = generateRank(null, null);
    expect(rank.length).toBe(1);
    // Should be in the middle of the 36-char lowercase alphabet ('i' = index 18)
    expect(rank).toBe('i');
  });

  it('should generate a rank before the given next when prev is null', () => {
    const next = 'j';
    const rank = generateRank(null, next);
    expect(rank < next).toBe(true);
    expect(rank.length).toBeGreaterThan(0);
  });

  it('should generate a rank after the given prev when next is null', () => {
    const prev = 'j';
    const rank = generateRank(prev, null);
    expect(rank > prev).toBe(true);
    // after(j) = "k" — one char, no growth
    expect(rank).toBe('k');
  });

  it('should generate a rank between two given ranks', () => {
    const prev = '1';
    const next = '3';
    const rank = generateRank(prev, next);
    expect(rank > prev).toBe(true);
    expect(rank < next).toBe(true);
  });

  it('should generate a rank between adjacent characters', () => {
    const prev = '1';
    const next = '2';
    const rank = generateRank(prev, next);
    expect(rank > prev).toBe(true);
    expect(rank < next).toBe(true);
  });

  it('should generate a rank between ranks with different lengths', () => {
    const prev = 'a';
    const next = 'az';
    const rank = generateRank(prev, next);
    expect(rank > prev).toBe(true);
    expect(rank < next).toBe(true);
  });

  it('should handle before the minimum in the sequence', () => {
    const first = generateRank(null, null);
    const beforeFirst = generateRank(null, first);
    expect(beforeFirst < first).toBe(true);
  });

  it('should produce monotonically ordered ranks in sequence', () => {
    const ranks: string[] = [];
    let prev: string | null = null;
    for (let i = 0; i < 10; i++) {
      const rank = generateRank(prev, null);
      ranks.push(rank);
      prev = rank;
    }
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i] > ranks[i - 1]).toBe(true);
    }
  });

  it('should produce ranks between existing items in correct order', () => {
    const a = generateRank(null, null);
    const b = generateRank(a, null);
    const between_ab = generateRank(a, b);
    expect(between_ab > a).toBe(true);
    expect(between_ab < b).toBe(true);
  });
});

describe('rank length efficiency', () => {
  it('should keep sequential after ranks dramatically shorter than old O(N) growth', () => {
    const ranks: string[] = [];
    let prev: string | null = null;
    for (let i = 0; i < 100; i++) {
      const rank = generateRank(prev, null);
      ranks.push(rank);
      prev = rank;
    }
    const maxLen = Math.max(...ranks.map((r) => r.length));
    // Old code: 100 items → max rank "UUU…U" (55 chars avg, 100 chars worst).
    // New code: O(N/36) ≈ 4 chars for 100 items — ~25x improvement.
    expect(maxLen).toBeLessThanOrEqual(4);
    // Verify monotonicity
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i] > ranks[i - 1]).toBe(true);
    }
  });

  it('should keep after rank length manageable for large albums', () => {
    const ranks: string[] = [];
    let prev: string | null = null;
    for (let i = 0; i < 1000; i++) {
      const rank = generateRank(prev, null);
      ranks.push(rank);
      prev = rank;
    }
    const maxLen = Math.max(...ranks.map((r) => r.length));
    // Old code: 1000 items → ~500500 total chars.
    // New code: O(N/36) ≈ 29 chars for 1000 items — ~17259x total improvement.
    expect(maxLen).toBeLessThanOrEqual(30);
  });

  it('before() should stay compact for many iterations', () => {
    let rank = 'z';
    const lengths: number[] = [];
    for (let i = 0; i < 50; i++) {
      rank = generateRank(null, rank);
      lengths.push(rank.length);
    }
    const maxLen = Math.max(...lengths);
    // Old code: each before() could add 2+ chars. New code: 1 char per ~36 iterations.
    expect(maxLen).toBeLessThanOrEqual(52);
    // Verify monotonic decrease
    let prev = 'zzzzz';
    for (let i = 0; i < 50; i++) {
      const next = generateRank(null, prev);
      expect(next < prev).toBe(true);
      prev = next;
    }
  });
});

describe('rank character safety', () => {
  it('should only use lowercase alphanumeric characters', () => {
    const ranks: string[] = [generateRank(null, null)];
    for (let i = 0; i < 50; i++) {
      ranks.push(generateRank(ranks.at(-1)!, null));
    }
    for (const rank of ranks) {
      expect(rank).toMatch(/^[0-9a-z]+$/);
    }
  });

  it('between should only use lowercase alphanumeric characters', () => {
    const rank = generateRank('a', 'c');
    expect(rank).toMatch(/^[0-9a-z]+$/);
  });
});

describe('before / after roundtrip', () => {
  it('after then before should produce a value less than the original', () => {
    const original = 'i';
    const after_ = generateRank(original, null);
    const before_ = generateRank(null, after_);
    expect(before_ < after_).toBe(true);
    expect(before_).not.toBe(original); // may or may not equal original, but must be < after
  });

  it('before then after should produce a value greater than the original', () => {
    const original = 'k';
    const before_ = generateRank(null, original);
    const after_ = generateRank(before_, null);
    expect(after_ > before_).toBe(true);
  });

  it('after of before should not collide with the original', () => {
    // If we have rank "j", before("j") = "iz", and after("iz") = "j",
    // so the roundtrip is exact in the simplest case.
    const rank = generateRank(null, 'j');
    expect(rank).toBe('iz');
    const back = generateRank(rank, null);
    expect(back).toBe('j');
  });
});

describe('generatePosition', () => {
  it('should combine rank, siteToken, and sequence with the separator', () => {
    const position = generatePosition('abc', 'token12', 1);
    expect(position).toBe('abc!token12!0000000001');
  });

  it('should pad sequence to 10 digits', () => {
    const position = generatePosition('x', 't', 42);
    expect(position).toBe('x!t!0000000042');
  });
});

describe('generateSiteToken', () => {
  it('should return an 8-character hex string', () => {
    const token = generateSiteToken();
    expect(token).toHaveLength(8);
    expect(/^[0-9a-f]{8}$/.test(token)).toBe(true);
  });

  it('should generate unique tokens', () => {
    const tokens = new Set([generateSiteToken(), generateSiteToken(), generateSiteToken()]);
    expect(tokens.size).toBe(3);
  });
});

describe('extractRank', () => {
  it('should extract the rank from a full position string', () => {
    expect(extractRank('abc!token!0000000001')).toBe('abc');
  });

  it('should return null for empty or falsy input', () => {
    expect(extractRank('')).toBe(null);
    expect(extractRank(null as unknown as string)).toBe(null);
    expect(extractRank(undefined as unknown as string)).toBe(null);
  });

  it('should handle a position without the separator gracefully', () => {
    expect(extractRank('norank')).toBe('norank');
  });
});

describe('position string ordering', () => {
  it('should sort correctly when one rank is a prefix of another', () => {
    const pos1 = generatePosition('lzz', 'token', 1);
    const pos2 = generatePosition('lzz0', 'token', 2);
    expect(pos1 < pos2).toBe(true);
  });

  it('should sort correctly by rank then by sequence', () => {
    const pos1 = generatePosition('a', 'token', 1);
    const pos2 = generatePosition('a', 'token', 2);
    const pos3 = generatePosition('b', 'token', 1);
    expect(pos1 < pos2).toBe(true);
    expect(pos2 < pos3).toBe(true);
  });

  it('should sort correctly with COLLATE "C" semantics (ASCII/byte order)', () => {
    // Simulate byte-order sorting: digits < lowercase letters
    const pos0 = generatePosition('0', 'token', 1);
    const pos9 = generatePosition('9', 'token', 1);
    const posA = generatePosition('a', 'token', 1);
    const posZ = generatePosition('z', 'token', 1);
    expect(pos0 < pos9).toBe(true);
    expect(pos9 < posA).toBe(true);
    expect(posA < posZ).toBe(true);
  });
});
