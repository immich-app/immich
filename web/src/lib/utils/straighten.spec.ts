import { calculateLargestInscribedRect, calculateStraightenScale } from './straighten';

describe('calculateStraightenScale', () => {
  it('should return 1 at 0 degrees', () => {
    expect(calculateStraightenScale({ width: 1000, height: 800 }, 0)).toBe(1);
  });

  it('should scale a rotated image enough to cover its original bounds', () => {
    expect(calculateStraightenScale({ width: 1000, height: 800 }, 10)).toBeCloseTo(1.201);
  });

  it('should return 1 for invalid image dimensions', () => {
    expect(calculateStraightenScale({ width: 0, height: 800 }, 10)).toBe(1);
    expect(calculateStraightenScale({ width: 1000, height: Number.NaN }, 10)).toBe(1);
  });
});

describe('calculateLargestInscribedRect', () => {
  const image16_9 = { width: 1920, height: 1080 };
  const image4_3 = { width: 1440, height: 1080 };
  const image1_1 = { width: 1000, height: 1000 };

  it('should return the original bounds at 0 degrees for a matching aspect ratio', () => {
    const result = calculateLargestInscribedRect(image16_9, 0, '16:9');
    expect(result.width).toBeCloseTo(1920, -1);
    expect(result.height).toBeCloseTo(1080, -1);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it('should return correct square bounds inside square image at 45 degrees', () => {
    const result = calculateLargestInscribedRect(image1_1, 45, '1:1');
    // For a 1000x1000 square rotated by 45 degrees, max square width/height is 1000 / sqrt(2) ≈ 707
    expect(result.width).toBe(707);
    expect(result.height).toBe(result.width);
    // Center alignment check
    expect(result.x).toBe(Math.floor((1000 - result.width) / 2));
    expect(result.y).toBe(Math.floor((1000 - result.height) / 2));
  });

  it('should handle positive and negative angles identically', () => {
    const resultPositive = calculateLargestInscribedRect(image16_9, 15, '16:9');
    const resultNegative = calculateLargestInscribedRect(image16_9, -15, '16:9');
    expect(resultPositive).toEqual(resultNegative);
  });

  it('should support various aspect ratios (16:9, 4:3, 1:1)', () => {
    const ratios = ['16:9', '4:3', '1:1', 'free'];
    for (const ratio of ratios) {
      const result = calculateLargestInscribedRect(image16_9, 20, ratio);
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
      expect(result.x + result.width).toBeLessThanOrEqual(1920);
      expect(result.y + result.height).toBeLessThanOrEqual(1080);
    }
  });

  it('should handle edge cases like large angles close to 45 degrees', () => {
    const result = calculateLargestInscribedRect(image4_3, 44.9, '4:3');
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.x + result.width).toBeLessThanOrEqual(1440);
    expect(result.y + result.height).toBeLessThanOrEqual(1080);
  });

  it('should handle invalid or zero-size images gracefully', () => {
    const result = calculateLargestInscribedRect({ width: 0, height: 100 }, 15, '16:9');
    expect(result).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });
});
