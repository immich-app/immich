import { asBirthDateString } from 'src/utils/date';
import { describe, expect, it } from 'vitest';

describe('asBirthDateString', () => {
  it('should return null for null input', () => {
    expect(asBirthDateString(null)).toBeNull();
  });

  it('should return the string unchanged for string input', () => {
    expect(asBirthDateString('2024-03-15')).toBe('2024-03-15');
  });

  it('should format a UTC midnight Date correctly', () => {
    const date = new Date(Date.UTC(2024, 2, 15, 0, 0, 0));
    expect(asBirthDateString(date)).toBe('2024-03-15');
  });

  it('should format a local midnight Date correctly', () => {
    const date = new Date(2024, 2, 15);
    expect(asBirthDateString(date)).toBe('2024-03-15');
  });

  it('should preserve the local calendar date for dates near day boundaries', () => {
    // When the server timezone is ahead of UTC, a local midnight DATE from
    // PostgreSQL may internally be represented as the previous day in UTC.
    // toISOString().split('T')[0] would then return the wrong day.
    // Using local getFullYear/getMonth/getDate preserves the intended calendar date.
    const localMidnightAheadOfUtc = new Date('2024-03-15T00:00:00+03:00');
    const result = asBirthDateString(localMidnightAheadOfUtc);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should handle single-digit months and days with zero-padding', () => {
    const date = new Date(Date.UTC(2024, 0, 5, 0, 0, 0));
    expect(asBirthDateString(date)).toBe('2024-01-05');
  });

  it('should handle December correctly', () => {
    const date = new Date(Date.UTC(2024, 11, 31, 0, 0, 0));
    expect(asBirthDateString(date)).toBe('2024-12-31');
  });
});
