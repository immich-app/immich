import { DateTime } from 'luxon';
import { get } from 'svelte/store';
import { dateFormats } from '$lib/constants';
import { locale } from '$lib/stores/preferences.store';

export function parseUtcDate(date: string) {
  return DateTime.fromISO(date, { zone: 'UTC' }).toUTC();
}

const getDateRange = (startTimestamp: string, endTimestamp: string, format: 'short' | 'long') => {
  const userLocale = get(locale);
  const startDate = DateTime.fromISO(startTimestamp).setZone('UTC');
  const endDate = DateTime.fromISO(endTimestamp).setZone('UTC').setLocale(userLocale);

  if (startDate.year === endDate.year && startDate.month === endDate.month && format === 'short') {
    return endDate.toLocaleString({ month: 'long', year: 'numeric' });
  }

  const formatter = new Intl.DateTimeFormat(
    userLocale,
    format === 'short' ? dateFormats.albumShort : dateFormats.album,
  );
  return formatter.formatRange(startDate.toJSDate(), endDate.toJSDate());
};

/**
 * Get localized date range in short format like 'Oct – Nov 2026', with full month if start and end are the same: 'October 2026'
 */
export const getShortDateRange = (start: string, end: string) => getDateRange(start, end, 'short');

export const getAlbumDateRange = (start: string, end: string) => getDateRange(start, end, 'long');

/**
 * Use this to convert from "5pm EST" to "5pm UTC"
 *
 * Useful with some APIs where you want to query by "today", but the values in the database are stored as UTC
 */
export const asLocalTimeISO = (date: DateTime<true>) =>
  (date.setZone('utc', { keepLocalTime: true }) as DateTime<true>).toISO();

const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

type DayOfWeek = (typeof days)[number];
export const dayOfWeek = (day: DayOfWeek, options?: { locale?: string; style?: 'long' | 'short' | 'narrow' }) => {
  const fmt = new Intl.DateTimeFormat(options?.locale, { weekday: options?.style ?? 'long', timeZone: 'UTC' });
  // 2021-08-01 is a Sunday
  return fmt.format(new Date(Date.UTC(2021, 7, 1 + days.indexOf(day))));
};
