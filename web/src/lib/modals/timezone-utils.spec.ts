import { calcNewDate, getPreferredTimeZone, getTimezones, toIsoDate } from '#lib/modals/timezone-utils.ts';
import { DateTime } from 'luxon';

const berlin = (date: string) => getTimezones(date).find((zone) => zone.value === 'Europe/Berlin')!;

describe('getPreferredTimeZone', () => {
  it('prefers the initial time zone with its offset for the date', () => {
    const date = DateTime.fromISO('2024-01-01');
    expect(getPreferredTimeZone(date, 'Europe/Berlin', getTimezones('2024-01-01T00:00:00.000'))).toMatchObject({
      value: 'Europe/Berlin',
      label: 'Europe/Berlin (+01:00)',
    });
  });

  it('uses the daylight saving offset for a summer date', () => {
    const date = DateTime.fromISO('2024-07-01');
    expect(getPreferredTimeZone(date, 'Europe/Berlin', getTimezones('2024-07-01T00:00:00.000'))).toMatchObject({
      label: 'Europe/Berlin (+02:00)',
    });
  });

  it('keeps the previously selected zone', () => {
    const date = DateTime.fromISO('2024-01-01');
    const timezones = getTimezones('2024-01-01T00:00:00.000');
    const tokyo = timezones.find((zone) => zone.value === 'Asia/Tokyo');
    expect(getPreferredTimeZone(date, 'Europe/Berlin', timezones, tokyo)).toBe(tokyo);
  });

  it('falls back to UTC when nothing matches', () => {
    expect(getPreferredTimeZone(DateTime.fromISO('2024-01-01'), undefined, [])).toMatchObject({ value: 'UTC' });
  });
});

describe('getTimezones', () => {
  it.each(['2024-01-01T00:00', '2024-01-01T00:00:00', '2024-01-01T00:00:00.000'])(
    'treats %s as a valid date for every precision a datetime-local input emits',
    (date) => {
      expect(berlin(date)).toMatchObject({ valid: true, label: 'Europe/Berlin (+01:00)' });
    },
  );

  it('marks a time that does not exist in a zone as invalid', () => {
    expect(getTimezones('2024-03-31T02:30:00').some((zone) => zone.value === 'Europe/Berlin')).toBe(false);
  });
});

describe('toIsoDate', () => {
  it('keeps the local time and applies the zone offset', () => {
    expect(toIsoDate('2024-01-01T00:00:00.000', berlin('2024-01-01T00:00:00.000'))).toBe(
      '2024-01-01T00:00:00.000+01:00',
    );
  });

  it('applies the daylight saving offset', () => {
    expect(toIsoDate('2024-07-01T00:00:00.000', berlin('2024-07-01T00:00:00.000'))).toBe(
      '2024-07-01T00:00:00.000+02:00',
    );
  });
});

describe('calcNewDate', () => {
  it.each([
    ['2024-01-01T00:00:00.000+01:00', 0, undefined, '2024-01-01T00:00:00.000'],
    ['2024-01-01T04:00:00.000+05:00', 0, undefined, '2024-01-01T04:00:00.000'],
    ['2024-01-01T00:00:00.000+00:00', 0, 'Europe/Berlin', '2024-01-01T01:00:00.000'],
    ['2024-07-01T00:00:00.000+00:00', 0, 'Europe/Berlin', '2024-07-01T02:00:00.000'],
    ['2024-01-01T00:00:00.000+01:00', 1440, undefined, '2024-01-02T00:00:00.000'],
    ['2024-01-01T00:00:00.000+01:00', -1440, undefined, '2023-12-31T00:00:00.000'],
    ['2024-01-01T00:00:00.000-01:00', -1440, 'America/Anchorage', '2023-12-30T16:00:00.000'],
  ])('%s shifted by %i minutes in %s is %s', (timestamp, duration, timezone, expected) => {
    expect(calcNewDate(DateTime.fromISO(timestamp, { setZone: true }), duration, timezone)).toBe(expected);
  });
});
