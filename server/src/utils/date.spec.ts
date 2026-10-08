import { DateTime } from 'luxon';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { asDateString, asDateTimeString, asLocalTime, isLeapDayObserved } from 'src/utils/date.js';

describe('asDateString', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return null for null input', () => {
    expect(asDateString(null)).toBeNull();
  });

  it('should pass through a pre-serialized string unchanged', () => {
    expect(asDateString('2000-01-15')).toBe('2000-01-15');
  });

  // a `date` column is parsed as `new Date('YYYY-MM-DD')`, which is UTC midnight regardless of the server time zone
  it.each(['UTC', 'America/Los_Angeles', 'America/New_York', 'Europe/Istanbul', 'Pacific/Kiritimati'])(
    'should return the UTC calendar date of a date column when the server time zone is %s',
    (timeZone) => {
      vi.stubEnv('TZ', timeZone);
      expect(asDateString(new Date('2000-01-15'))).toBe('2000-01-15');
    },
  );

  it('should correctly pad years with a leading 0', () => {
    expect(asDateString(new Date('0280-12-12'))).toBe('0280-12-12');
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

describe('asLocalTime', () => {
  it('should keep the wall-clock time and reinterpret it as UTC', () => {
    const date = DateTime.fromISO('2026-10-06T08:00:00', { zone: 'America/New_York' }) as DateTime<true>;
    expect(asLocalTime(date).toISOString()).toBe('2026-10-06T08:00:00.000Z');
  });
});
