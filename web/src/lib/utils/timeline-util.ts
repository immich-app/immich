import { locale } from '$lib/stores/preferences.store';
import { memoize } from 'lodash-es';
import { DateTime, type LocaleOptions } from 'luxon';
import { get } from 'svelte/store';

export type ScrubberListener = (
  bucketDate: string | undefined,
  overallScrollPercent: number,
  bucketScrollPercent: number,
) => void | Promise<void>;

export const fromLocalDateTime = (localDateTime: string) =>
  DateTime.fromISO(localDateTime, { zone: 'UTC', locale: get(locale) });

export const fromDateTimeOriginal = (dateTimeOriginal: string, timeZone: string) =>
  DateTime.fromISO(dateTimeOriginal, { zone: timeZone });

export function formatGroupTitle(_date: DateTime): string {
  if (!_date.isValid) {
    return _date.toString();
  }
  const date = _date as DateTime<true>;
  const today = DateTime.now().startOf('day');

  // Today
  if (today.hasSame(date, 'day')) {
    return date.toRelativeCalendar();
  }

  // Yesterday
  if (today.minus({ days: 1 }).hasSame(date, 'day')) {
    return date.toRelativeCalendar();
  }

  // Last week
  if (date >= today.minus({ days: 6 }) && date < today) {
    return date.toLocaleString({ weekday: 'long' }, { locale: get(locale) });
  }

  // This year
  if (today.hasSame(date, 'year')) {
    return date.toLocaleString(
      {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      },
      { locale: get(locale) },
    );
  }

  return getDateLocaleString(date, { locale: get(locale) });
}

export const getDateLocaleString = (date: DateTime, opts?: LocaleOptions): string =>
  date.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY, opts);

export const formatDateGroupTitle = memoize(formatGroupTitle);
