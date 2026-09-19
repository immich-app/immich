import { describe, expect, it } from 'vitest';
import { asDateString, asDateTimeString, isLeapDayObserved } from 'src/utils/date.js';

describe('asDateString', () => {
  it('should return null for null input', () => {
    expect(asDateString(null)).toBeNull();
  });

  it('should pass through a pre-serialized string unchanged', () => {
    expect(asDateString('2000-01-15')).toBe('2000-01-15');
  });

  it('should return the local calendar date, not the UTC date', () => {
    const date = new Date(2000, 0, 15); // 15 Jan 2000, local midnight
    expect(asDateString(date)).toBe('2000-01-15');
  });

  it('should correctly pad years with a leading 0', () => {
    expect(asDateString(new Date('280-12-12'))).toBe('0280-12-12');
  });
});

describe('isLeapDayObserved', () => {
  it('should return true on february 28th in a non-leap year', () => {
    expect(isLeapDayObserved({ year: 2025, month: 2, day: 28 })).toBe(true);
  });

  it('should return false on february 28th in a leap year', () => {
    expect(isLeapDayObserved({ year: 2024, month: 2, day: 28 })).toBe(false);
    expect(isLeapDayObserved({ year: 2000, month: 2, day: 28 })).toBe(false);
  });

  it('should return true on february 28th in a century that is not a leap year', () => {
    expect(isLeapDayObserved({ year: 1900, month: 2, day: 28 })).toBe(true);
    expect(isLeapDayObserved({ year: 2100, month: 2, day: 28 })).toBe(true);
  });

  it('should return false on other days', () => {
    expect(isLeapDayObserved({ year: 2025, month: 2, day: 27 })).toBe(false);
    expect(isLeapDayObserved({ year: 2025, month: 3, day: 28 })).toBe(false);
  });
});

describe('asDateTimeString', () => {
  it('should return null for null input', () => {
    expect(asDateTimeString(null)).toBeNull();
  });

  it('should pass through a pre-serialized string unchanged', () => {
    const iso = '2000-01-15T12:00:00.000Z';
    expect(asDateTimeString(iso)).toBe(iso);
  });

  it('should return an ISO 8601 datetime string for a Date', () => {
    const date = new Date('2000-01-15T12:00:00.000Z');
    expect(asDateTimeString(date)).toBe('2000-01-15T12:00:00.000Z');
  });
});
