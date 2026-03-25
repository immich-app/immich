import { elementWiseMean } from 'src/utils/vector';

describe('elementWiseMean', () => {
  it('should average two vectors', () => {
    const result = elementWiseMean([
      [1, 2, 3],
      [3, 4, 5],
    ]);
    expect(result).toEqual([2, 3, 4]);
  });

  it('should return the vector unchanged for a single input', () => {
    const result = elementWiseMean([[1, 2, 3]]);
    expect(result).toEqual([1, 2, 3]);
  });

  it('should handle floating point values', () => {
    const result = elementWiseMean([
      [0.1, 0.2],
      [0.3, 0.4],
    ]);
    expect(result[0]).toBeCloseTo(0.2);
    expect(result[1]).toBeCloseTo(0.3);
  });

  it('should throw for empty input', () => {
    expect(() => elementWiseMean([])).toThrow('Cannot compute mean of empty array');
  });

  it('should handle 512-dim vectors (CLIP embedding size)', () => {
    const a = Array.from({ length: 512 }, () => Math.random());
    const b = Array.from({ length: 512 }, () => Math.random());
    const result = elementWiseMean([a, b]);
    expect(result).toHaveLength(512);
    expect(result[0]).toBeCloseTo((a[0] + b[0]) / 2);
    expect(result[511]).toBeCloseTo((a[511] + b[511]) / 2);
  });
});
