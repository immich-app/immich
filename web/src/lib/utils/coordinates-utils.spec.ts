import { describe, expect, it } from 'vitest';
import { parseCoordinateString } from './coordinates-utils';

describe('parseCoordinateString', () => {
  it('should return null for invalid input', () => {
    expect(parseCoordinateString('')).toBeNull();
    expect(parseCoordinateString(null as unknown as string)).toBeNull();
    expect(parseCoordinateString(undefined as unknown as string)).toBeNull();
    expect(parseCoordinateString('not coordinates')).toBeNull();
    expect(parseCoordinateString('123')).toBeNull();
    expect(parseCoordinateString('123, 456, 789')).toBeNull();
  });

  it('should parse basic decimal coordinates', () => {
    const result = parseCoordinateString('23.93111, 31.50428');
    expect(result).toEqual({ latitude: 23.931_11, longitude: 31.504_28 });
  });

  it('should parse negative decimal coordinates', () => {
    const result = parseCoordinateString('-23.93111, -31.50428');
    expect(result).toEqual({ latitude: -23.931_11, longitude: -31.504_28 });
  });

  it('should parse mixed positive/negative coordinates', () => {
    const result = parseCoordinateString('-23.93111, 31.50428');
    expect(result).toEqual({ latitude: -23.931_11, longitude: 31.504_28 });
  });

  it('should parse coordinates with degree symbols', () => {
    const result = parseCoordinateString('23.93111°, 31.50428°');
    expect(result).toEqual({ latitude: 23.931_11, longitude: 31.504_28 });
  });

  it('should parse coordinates with cardinal directions at the end', () => {
    const result = parseCoordinateString('23.93111° S, 31.50428° E');
    expect(result).toEqual({ latitude: -23.931_11, longitude: 31.504_28 });
  });

  it('should parse coordinates with cardinal directions at the end (no spaces)', () => {
    const result = parseCoordinateString('23.93111°S, 31.50428°E');
    expect(result).toEqual({ latitude: -23.931_11, longitude: 31.504_28 });
  });

  it('should parse coordinates with cardinal directions at the beginning', () => {
    const result = parseCoordinateString('S 23.93111°, E 31.50428°');
    expect(result).toEqual({ latitude: -23.931_11, longitude: 31.504_28 });
  });

  it('should parse coordinates with cardinal directions (no degree symbols)', () => {
    const result = parseCoordinateString('23.93111 S, 31.50428 E');
    expect(result).toEqual({ latitude: -23.931_11, longitude: 31.504_28 });
  });

  it('should parse coordinates with N/W cardinal directions', () => {
    const result = parseCoordinateString('23.93111 N, 31.50428 W');
    expect(result).toEqual({ latitude: 23.931_11, longitude: -31.504_28 });
  });

  it('should handle various whitespace patterns', () => {
    expect(parseCoordinateString('  23.93111  ,  31.50428  ')).toEqual({
      latitude: 23.931_11,
      longitude: 31.504_28,
    });
    expect(parseCoordinateString('23.93111°  S  ,  31.50428°  E')).toEqual({
      latitude: -23.931_11,
      longitude: 31.504_28,
    });
  });

  it('should handle integer coordinates', () => {
    const result = parseCoordinateString('23, 31');
    expect(result).toEqual({ latitude: 23, longitude: 31 });
  });

  it('should handle zero coordinates', () => {
    const result = parseCoordinateString('0, 0');
    expect(result).toEqual({ latitude: 0, longitude: 0 });
  });

  it('should validate latitude range', () => {
    expect(parseCoordinateString('91, 0')).toBeNull(); // latitude > 90
    expect(parseCoordinateString('-91, 0')).toBeNull(); // latitude < -90
    expect(parseCoordinateString('90, 0')).toEqual({ latitude: 90, longitude: 0 }); // boundary valid
    expect(parseCoordinateString('-90, 0')).toEqual({ latitude: -90, longitude: 0 }); // boundary valid
  });

  it('should validate longitude range', () => {
    expect(parseCoordinateString('0, 181')).toBeNull(); // longitude > 180
    expect(parseCoordinateString('0, -181')).toBeNull(); // longitude < -180
    expect(parseCoordinateString('0, 180')).toEqual({ latitude: 0, longitude: 180 }); // boundary valid
    expect(parseCoordinateString('0, -180')).toEqual({ latitude: 0, longitude: -180 }); // boundary valid
  });

  it('should handle coordinates with cardinal directions and negative signs correctly', () => {
    // Cardinal directions should override negative signs
    const result1 = parseCoordinateString('-23.93111 N, -31.50428 E');
    expect(result1).toEqual({ latitude: 23.931_11, longitude: 31.504_28 });

    const result2 = parseCoordinateString('-23.93111 S, -31.50428 W');
    expect(result2).toEqual({ latitude: -23.931_11, longitude: -31.504_28 });
  });

  it('should ignore invalid cardinal directions and treat as no cardinal', () => {
    // Invalid cardinal directions should be ignored and treated as regular decimal coordinates
    const result1 = parseCoordinateString('23.93111 X, 31.50428 Y');
    expect(result1).toEqual({ latitude: 23.931_11, longitude: 31.504_28 });

    // Cardinal directions in wrong position should be ignored
    const result2 = parseCoordinateString('23.93111 E, 31.50428 N');
    expect(result2).toEqual({ latitude: 23.931_11, longitude: 31.504_28 });
  });

  it('should return null for non-numeric values', () => {
    expect(parseCoordinateString('abc, 31.50428')).toBeNull();
    expect(parseCoordinateString('23.93111, def')).toBeNull();
    expect(parseCoordinateString('abc N, 31.50428 E')).toBeNull();
  });

  it('should handle edge cases with complex formatting', () => {
    const result1 = parseCoordinateString('N23.93111°, W31.50428°');
    expect(result1).toEqual({ latitude: 23.931_11, longitude: -31.504_28 });

    const result2 = parseCoordinateString('S23.93111, E31.50428');
    expect(result2).toEqual({ latitude: -23.931_11, longitude: 31.504_28 });
  });
});
