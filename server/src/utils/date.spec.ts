import { Settings } from 'luxon';
import { asDateString, asDateTimeString } from 'src/utils/date';
import { afterEach, describe, expect, it } from 'vitest';

describe('asDateString', () => {
  it('should return null for null input', () => {
    expect(asDateString(null)).toBeNull();
  });

  it('should pass through a pre-serialized string unchanged', () => {
    expect(asDateString('2000-01-15')).toBe('2000-01-15');
  });

  afterEach(() => {
    Settings.defaultZone = 'system';
  });

  it('should return the UTC calendar date', () => {
    const date = new Date('2000-01-15'); // parsed as UTC midnight, like a database `date` column
    expect(asDateString(date)).toBe('2000-01-15');
  });

  it('should not shift the date when the server runs in a timezone behind UTC', () => {
    Settings.defaultZone = 'America/Chicago';
    expect(asDateString(new Date('1994-09-01'))).toBe('1994-09-01');
  });

  it('should correctly pad years with a leading 0', () => {
    expect(asDateString(new Date('280-12-12'))).toBe('0280-12-12');
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
