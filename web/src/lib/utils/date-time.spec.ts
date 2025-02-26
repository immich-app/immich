import { writable } from 'svelte/store';
import { getAlbumDateRange, timeToSeconds } from './date-time';

describe('converting time to seconds', () => {
  it('parses hh:mm:ss correctly', () => {
    expect(timeToSeconds('01:02:03')).toBeCloseTo(3723);
  });

  it('parses hh:mm:ss.SSS correctly', () => {
    expect(timeToSeconds('01:02:03.456')).toBeCloseTo(3723.456);
  });

  it('parses h:m:s.S correctly', () => {
    expect(timeToSeconds('1:2:3.4')).toBeCloseTo(3723.4);
  });

  it('parses hhh:mm:ss.SSS correctly', () => {
    expect(timeToSeconds('100:02:03.456')).toBeCloseTo(360_123.456);
  });

  it('ignores ignores double milliseconds hh:mm:ss.SSS.SSSSSS', () => {
    expect(timeToSeconds('01:02:03.456.123456')).toBeCloseTo(3723.456);
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
