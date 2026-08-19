import { asDateString, asDateTimeString } from 'src/utils/date';
import { describe, expect, it } from 'vitest';

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
