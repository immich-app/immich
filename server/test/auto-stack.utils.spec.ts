import { cosSim01, extractNumericSuffix, hammingHex64, norm } from 'src/services/auto-stack.utils';
import { describe, expect, it } from 'vitest';

describe('auto-stack.utils', () => {
  it('norm computes L2 correctly', () => {
    expect(norm([])).toBe(0);
    expect(norm([3, 4])).toBe(5);
  });

  it('cosSim01 maps orthogonal/identical/opposite', () => {
    expect(cosSim01([1, 0], [0, 1])).toBeCloseTo(0.5, 6);
    expect(cosSim01([1, 0], [1, 0])).toBeCloseTo(1, 6);
    expect(cosSim01([1, 0], [-1, 0])).toBeCloseTo(0, 6);
  });

  it('hammingHex64 computes bit differences for 16-hex strings', () => {
    expect(hammingHex64('aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa')).toBe(0);
    // a ^ b = 0x1 for each nibble -> 1 bit difference per nibble -> 16 bits total
    expect(hammingHex64('aaaaaaaaaaaaaaaa', 'bbbbbbbbbbbbbbbb')).toBe(16);
    // a ^ f = 0x5 -> popcount(0x5)=2 per nibble -> 32 bits total
    expect(hammingHex64('aaaaaaaaaaaaaaaa', 'ffffffffffffffff')).toBe(32);
    expect(hammingHex64('invalid', 'ffffffffffffffff')).toBe(Number.POSITIVE_INFINITY);
  });

  it('extractNumericSuffix parses trailing digits before extension', () => {
    expect(extractNumericSuffix('IMG_0123.jpg')).toBe(123);
    expect(extractNumericSuffix('photo.png')).toBeNull();
    expect(extractNumericSuffix('clip_000045.MOV')).toBe(45);
  });
});
