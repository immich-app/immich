import { writable } from 'svelte/store';
import { getAlbumDateRange, getShortDateRange } from './date-time';

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
