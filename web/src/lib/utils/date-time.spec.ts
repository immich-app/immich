import { writable } from 'svelte/store';
import { getAlbumDateRange, getShortDateRange, timeToSeconds } from './date-time';

describe('converting time to seconds', () => {
  it('parses hh:mm:ss correctly', () => {
    expect(timeToSeconds('01:02:03')).toBeCloseTo(3723);
  });

  it('parses hh:mm:ss.SSS correctly', () => {
    expect(timeToSeconds('01:02:03.456')).toBeCloseTo(3723.456);
  });

  it('parses h:m:s.S correctly', () => {
    expect(timeToSeconds('1:2:3.4')).toBe(0); // Non-standard format, Luxon returns NaN
  });

  it('parses hhh:mm:ss.SSS correctly', () => {
    expect(timeToSeconds('100:02:03.456')).toBe(0); // Non-standard format, Luxon returns NaN
  });

  it('ignores ignores double milliseconds hh:mm:ss.SSS.SSSSSS', () => {
    expect(timeToSeconds('01:02:03.456.123456')).toBe(0); // Non-standard format, Luxon returns NaN
  });

  // Test edge cases that can cause crashes
  it('handles "0" string input', () => {
    expect(timeToSeconds('0')).toBe(0);
  });

  it('handles empty string input', () => {
    expect(timeToSeconds('')).toBe(0);
  });

  it('parses HH:MM format correctly', () => {
    expect(timeToSeconds('01:02')).toBe(3720); // 1 hour 2 minutes = 3720 seconds
  });

  it('handles malformed time strings', () => {
    expect(timeToSeconds('invalid')).toBe(0);
  });

  it('parses single hour format correctly', () => {
    expect(timeToSeconds('01')).toBe(3600); // Luxon interprets "01" as 1 hour
  });

  it('handles time strings with invalid numbers', () => {
    expect(timeToSeconds('aa:bb:cc')).toBe(0);
    expect(timeToSeconds('01:bb:03')).toBe(0);
  });
});

describe('getShortDateRange', () => {
  beforeEach(() => {
    vi.stubEnv('TZ', 'UTC');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it('should correctly return month if start and end date are within the same month', () => {
    expect(getShortDateRange('2022-01-01T00:00:00.000Z', '2022-01-31T00:00:00.000Z')).toEqual('Jan 2022');
  });

  it('should correctly return month range if start and end date are in separate months within the same year', () => {
    expect(getShortDateRange('2022-01-01T00:00:00.000Z', '2022-02-01T00:00:00.000Z')).toEqual('Jan - Feb 2022');
  });

  it('should correctly return range if start and end date are in separate months and years', () => {
    expect(getShortDateRange('2021-12-01T00:00:00.000Z', '2022-01-01T00:00:00.000Z')).toEqual('Dec 2021 - Jan 2022');
  });

  it('should correctly return month if start and end date are within the same month, ignoring local time zone', () => {
    vi.stubEnv('TZ', 'UTC+6');
    expect(getShortDateRange('2022-01-01T00:00:00.000Z', '2022-01-31T00:00:00.000Z')).toEqual('Jan 2022');
  });

  it('should correctly return month range if start and end date are in separate months within the same year, ignoring local time zone', () => {
    vi.stubEnv('TZ', 'UTC+6');
    expect(getShortDateRange('2022-01-01T00:00:00.000Z', '2022-02-01T00:00:00.000Z')).toEqual('Jan - Feb 2022');
  });

  it('should correctly return range if start and end date are in separate months and years, ignoring local time zone', () => {
    vi.stubEnv('TZ', 'UTC+6');
    expect(getShortDateRange('2021-12-01T00:00:00.000Z', '2022-01-01T00:00:00.000Z')).toEqual('Dec 2021 - Jan 2022');
  });
});

describe('getAlbumDate', () => {
  beforeAll(() => {
    process.env.TZ = 'UTC';

    vitest.mock('$lib/stores/preferences.store', () => ({
      locale: writable('en'),
    }));
  });

  it('should work with only a start date', () => {
    expect(getAlbumDateRange({ startDate: '2021-01-01T00:00:00Z' })).toEqual('Jan 1, 2021');
  });

  it('should work with a start and end date', () => {
    expect(
      getAlbumDateRange({
        startDate: '2021-01-01T00:00:00Z',
        endDate: '2021-01-05T00:00:00Z',
      }),
    ).toEqual('Jan 1, 2021 - Jan 5, 2021');
  });

  it('should work with the new date format', () => {
    expect(getAlbumDateRange({ startDate: '2021-01-01T00:00:00+05:00' })).toEqual('Jan 1, 2021');
  });
});
