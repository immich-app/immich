import { writable } from 'svelte/store';
import { locale } from '$lib/stores/preferences.store';
import { getAlbumDateRange, getShortDateRange } from './date-time';

vitest.mock('$lib/stores/preferences.store', () => ({
  locale: writable('en'),
}));

describe('getShortDateRange', () => {
  beforeEach(() => {
    vi.stubEnv('TZ', 'UTC');
    locale.set('en');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    locale.set('en');
  });

  it('should correctly return long month if start and end date are within the same month', () => {
    expect(getShortDateRange('2022-01-01T00:00:00.000Z', '2022-01-31T00:00:00.000Z')).toEqual('January 2022');
  });

  it('should correctly return month range if start and end date are in separate months within the same year', () => {
    expect(getShortDateRange('2022-01-01T00:00:00.000Z', '2022-02-01T00:00:00.000Z')).toEqual('Jan – Feb 2022');
  });

  it('should correctly return range if start and end date are in separate months and years', () => {
    expect(getShortDateRange('2021-12-01T00:00:00.000Z', '2022-01-01T00:00:00.000Z')).toEqual('Dec 2021 – Jan 2022');
  });

  it('should correctly return long month if start and end date are within the same month, ignoring local time zone', () => {
    vi.stubEnv('TZ', 'UTC+6');
    expect(getShortDateRange('2022-01-01T00:00:00.000Z', '2022-01-31T00:00:00.000Z')).toEqual('January 2022');
  });

  it('should correctly return long month if start and end date are within the same month, ignoring local time zone', () => {
    vi.stubEnv('TZ', 'UTC-6');
    expect(getShortDateRange('2022-01-01T00:00:00.000Z', '2022-01-31T00:00:00.000Z')).toEqual('January 2022');
  });

  it('should correctly return month range if start and end date are in separate months within the same year, ignoring local time zone', () => {
    vi.stubEnv('TZ', 'UTC+6');
    expect(getShortDateRange('2022-01-01T00:00:00.000Z', '2022-02-01T00:00:00.000Z')).toEqual('Jan – Feb 2022');
  });

  it('should correctly return range if start and end date are in separate months and years, ignoring local time zone', () => {
    vi.stubEnv('TZ', 'UTC+6');
    expect(getShortDateRange('2021-12-01T00:00:00.000Z', '2022-01-01T00:00:00.000Z')).toEqual('Dec 2021 – Jan 2022');
  });

  it('should correctly return range if start and end date are in separate months and years, ignoring local time zone', () => {
    vi.stubEnv('TZ', 'UTC-6');
    expect(getShortDateRange('2021-12-01T00:00:00.000Z', '2022-01-01T00:00:00.000Z')).toEqual('Dec 2021 – Jan 2022');
  });

  it('should use the correct locale to return month range', () => {
    locale.set('fr');
    expect(getShortDateRange('2022-01-01T00:00:00.000Z', '2022-02-01T00:00:00.000Z')).toEqual('janv.–févr. 2022');
  });

  it('should use the correct locale to return month-year range', () => {
    locale.set('fr');
    expect(getShortDateRange('2021-12-01T00:00:00.000Z', '2022-01-01T00:00:00.000Z')).toEqual('déc. 2021 – janv. 2022');
  });
});

describe('getAlbumDateRange', () => {
  beforeEach(() => {
    vi.stubEnv('TZ', 'UTC');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it('should work', () => {
    expect(getAlbumDateRange('2021-01-01T00:00:00Z', '2021-01-05T00:00:00Z')).toEqual('Jan 1 – 5, 2021');
  });

  it('should work with a single day range', () => {
    expect(getAlbumDateRange('2021-01-01T09:00:00Z', '2021-01-01T10:00:00Z')).toEqual('Jan 1, 2021');
  });

  it('should use the proper locale', () => {
    locale.set('fr');
    expect(getAlbumDateRange('2020-03-26T12:00:00Z', '2021-12-01T00:00:00Z')).toEqual('26 mars 2020 – 1 déc. 2021');
    locale.set('en');
  });

  it('should correctly return range if start and end date are in separate months and years, ignoring local time zone', () => {
    vi.stubEnv('TZ', 'UTC+6');
    expect(getAlbumDateRange('2021-12-01T00:00:00Z', '2022-01-01T00:00:00Z')).toEqual('Dec 1, 2021 – Jan 1, 2022');
  });

  it('should correctly return range if start and end date are in separate months and years, ignoring local time zone', () => {
    vi.stubEnv('TZ', 'UTC-6');
    expect(getAlbumDateRange('2021-12-01T00:00:00Z', '2022-01-01T00:00:00Z')).toEqual('Dec 1, 2021 – Jan 1, 2022');
  });
});
