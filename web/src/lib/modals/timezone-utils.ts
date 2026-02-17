import { DateTime, Duration } from 'luxon';

export type ZoneOption = {
  /**
   * Timezone name with offset
   *
   * e.g. Asia/Jerusalem (+03:00)
   */
  label: string;

  /**
   * Timezone name
   *
   * e.g. Asia/Jerusalem
   */
  value: string;

  /**
   * Timezone offset in minutes
   *
   * e.g. 300
   */
  offsetMinutes: number;

  /**
   * True iff the date is valid
   *
   * Dates may be invalid for various reasons, for example setting a day that does not exist (30 Feb 2024).
   * Due to daylight saving time, 2:30am is invalid for Europe/Berlin on Mar 31 2024.The two following local times
   * are one second apart:
   *
   * - Mar 31 2024 01:59:59 (GMT+0100, unix timestamp 1725058799)
   * - Mar 31 2024 03:00:00 (GMT+0200, unix timestamp 1711846800)
   *
   * Mar 31 2024 02:30:00 does not exist in Europe/Berlin, this is an invalid date/time/time zone combination.
   */
  valid: boolean;
};

const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const knownTimezones = Intl.supportedValuesOf('timeZone');

export function getTimezones(selectedDate: string) {
  // Use a fixed modern date to calculate stable timezone offsets for the list
  // This ensures that the offsets shown in the combobox are always current,
  // regardless of the historical date selected by the user.
  return knownTimezones
    .map((zone) => zoneOptionForDate(zone, selectedDate))
    .filter((zone) => zone.valid)
    .sort((zoneA, zoneB) => sortTwoZones(zoneA, zoneB));
}

export function getModernOffsetForZoneAndDate(
  zone: string,
  dateString: string,
): { offsetMinutes: number; offsetFormat: string } {
  const dt = DateTime.fromISO(dateString, { zone });

  // we determine the *modern* offset for this zone based on its current rules.
  // To do this, we "move" the date to the current year, keeping the local time components.
  // This allows Luxon to apply current-year DST rules.
  const modernYearDt = dt.set({ year: DateTime.now().year });

  // Calculate the offset at that modern year's date.
  const modernOffsetMinutes = modernYearDt.setZone(zone, { keepLocalTime: true }).offset;
  const modernOffsetFormat = modernYearDt.setZone(zone, { keepLocalTime: true }).toFormat('ZZ');

  return { offsetMinutes: modernOffsetMinutes, offsetFormat: modernOffsetFormat };
}

function zoneOptionForDate(zone: string, date: string) {
  const { offsetMinutes, offsetFormat: zoneOffsetAtDate } = getModernOffsetForZoneAndDate(zone, date);
  // For validity, we still need to check if the exact date/time exists in the *original* timezone.
  // Use the fact that in DST gaps Luxon advances the missing time by an hour.
  // Ignore milliseconds:
  // - milliseconds are not relevant for TZ calculations
  // - browsers strip insignificant .000 making string comparison with milliseconds more fragile.
  //
  // Also, some browsers emit `datetime-local` values without seconds when seconds are 00,
  // e.g. `2024-01-01T00:00` instead of `2024-01-01T00:00:00.000`.
  // In that case we must compare with minute precision (otherwise every zone looks "invalid").
  const dateInTimezone = DateTime.fromISO(date, { zone });
  const withoutMillis = date.replace(/\.\d+/, '');
  const hasSeconds = /T\d{2}:\d{2}:\d{2}$/.test(withoutMillis);
  const compareFormat = hasSeconds ? "yyyy-MM-dd'T'HH:mm:ss" : "yyyy-MM-dd'T'HH:mm";
  const exists = withoutMillis === dateInTimezone.toFormat(compareFormat);
  const valid = dateInTimezone.isValid && exists;
  return {
    value: zone,
    offsetMinutes,
    label: zone + ' (' + zoneOffsetAtDate + ')' + (valid ? '' : ' [invalid date!]'),
    valid,
  };
}

function sortTwoZones(zoneA: ZoneOption, zoneB: ZoneOption) {
  const offsetDifference = zoneA.offsetMinutes - zoneB.offsetMinutes;
  if (offsetDifference != 0) {
    return offsetDifference;
  }
  return zoneA.value.localeCompare(zoneB.value, undefined, { sensitivity: 'base' });
}

/*
 * If the time zone is not given, find the timezone to select for a given time, date, and offset (e.g. +02:00).
 *
 * This is done so that the list shown to the user includes more helpful names like "Europe/Berlin (+02:00)"
 * instead of just the raw offset or something like "UTC+02:00".
 *
 * The provided information (initialDate, from some asset) includes the offset (e.g. +02:00), but no information about
 * the actual time zone. As several countries/regions may share the same offset, for example Berlin (Germany) and
 * Blantyre (Malawi) sharing +02:00 in summer, we have to guess and somehow pick a suitable time zone.
 *
 * If the time zone configured by the user (in the browser) provides the same offset for the given date (accounting
 * for daylight saving time and other weirdness), we prefer to show it. This way, for German users, we might be able
 * to show "Europe/Berlin" instead of the lexicographically first entry "Africa/Blantyre".
 */
export function getPreferredTimeZone(
  date: DateTime,
  initialTimeZone: string | undefined,
  timezones: ZoneOption[],
  selectedOption?: ZoneOption,
) {
  const offset = date.offset;
  const previousSelection = timezones.find((item) => item.value === selectedOption?.value);
  const fromInitialTimeZone = timezones.find((item) => item.value === initialTimeZone);
  const sameAsUserTimeZone = timezones.find((item) => item.offsetMinutes === offset && item.value === userTimeZone);
  const firstWithSameOffset = timezones.find((item) => item.offsetMinutes === offset);
  const utcFallback = {
    label: 'UTC (+00:00)',
    offsetMinutes: 0,
    value: 'UTC',
    valid: true,
  };
  return previousSelection ?? fromInitialTimeZone ?? sameAsUserTimeZone ?? firstWithSameOffset ?? utcFallback;
}

export function toDatetime(selectedDate: string, selectedZone: ZoneOption) {
  const dtComponents = DateTime.fromISO(selectedDate, { zone: 'utc' });

  // Determine the modern, DST-aware offset for the selected IANA zone
  const { offsetMinutes } = getModernOffsetForZoneAndDate(selectedZone.value, selectedDate);

  // Construct the final ISO string with a fixed-offset zone.
  const fixedOffsetZone = `UTC${offsetMinutes >= 0 ? '+' : ''}${Duration.fromObject({ minutes: offsetMinutes }).toFormat('hh:mm')}`;

  // Create a DateTime object in this fixed-offset zone, preserving the local time.
  return DateTime.fromObject(dtComponents.toObject(), { zone: fixedOffsetZone });
}

export function toIsoDate(selectedDate: string, selectedZone: ZoneOption) {
  return toDatetime(selectedDate, selectedZone).toISO({ includeOffset: true })!;
}

export const calcNewDate = (timestamp: DateTime, selectedDuration: number, timezone?: string) => {
  let newDateTime = timestamp.plus({ minutes: selectedDuration });
  if (timezone) {
    newDateTime = newDateTime.setZone(timezone);
  }
  return newDateTime.toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS");
};
