import { dateFormats } from '$lib/constants';
import { locale } from '$lib/stores/preferences.store';
import { DateTime, Duration } from 'luxon';
import { get } from 'svelte/store';

/**
 * Convert time like `01:02:03.456` to seconds.
 */
export function timeToSeconds(time: string) {
  if (!time || time === '0') {
    return 0;
  }

  const seconds = Duration.fromISOTime(time).as('seconds');

  return Number.isNaN(seconds) ? 0 : seconds;
}
export function parseUtcDate(date: string) {
  return DateTime.fromISO(date, { zone: 'UTC' }).toUTC();
}

export const getShortDateRange = (startDate: string | Date, endDate: string | Date) => {
  startDate = startDate instanceof Date ? startDate : new Date(startDate);
  endDate = endDate instanceof Date ? endDate : new Date(endDate);

  const userLocale = get(locale);
  const endDateLocalized = endDate.toLocaleString(userLocale, {
    month: 'short',
    year: 'numeric',
  });

  if (startDate.getFullYear() === endDate.getFullYear()) {
    if (startDate.getMonth() === endDate.getMonth()) {
      // Same year and month.
      // e.g.: aug. 2024
      return endDateLocalized;
    } else {
      // Same year but different month.
      // e.g.: jul. - sept. 2024
      const startMonthLocalized = startDate.toLocaleString(userLocale, {
        month: 'short',
      });
      return `${startMonthLocalized} - ${endDateLocalized}`;
    }
  } else {
    // Different year.
    // e.g.: feb. 2021 - sept. 2024
    const startDateLocalized = startDate.toLocaleString(userLocale, {
      month: 'short',
      year: 'numeric',
    });
    return `${startDateLocalized} - ${endDateLocalized}`;
  }
};

const formatDate = (date?: string) => {
  if (!date) {
    return;
  }

  // without timezone
  const localDate = date.replace(/Z$/, '').replace(/\+.+$/, '');
  return localDate ? new Date(localDate).toLocaleDateString(get(locale), dateFormats.album) : undefined;
};

export const getAlbumDateRange = (album: { startDate?: string; endDate?: string }) => {
  const start = formatDate(album.startDate);
  const end = formatDate(album.endDate);

  if (start && end && start !== end) {
    return `${start} - ${end}`;
  }

  if (start) {
    return start;
  }

  return '';
};

/**
 * Use this to convert from "5pm EST" to "5pm UTC"
 *
 * Useful with some APIs where you want to query by "today", but the values in the database are stored as UTC
 */
export const asLocalTimeISO = (date: DateTime<true>) =>
  (date.setZone('utc', { keepLocalTime: true }) as DateTime<true>).toISO();

/**
 * Creates a date range for filtering assets based on year, month, and day parameters
 */
export const buildDateRangeFromYearMonthAndDay = (year: number, month?: number, day?: number) => {
  const baseDate = DateTime.fromObject({
    year,
    month: month || 1,
    day: day || 1,
  });

  let from: DateTime;
  let to: DateTime;

  if (day) {
    from = baseDate.startOf('day');
    to = baseDate.plus({ days: 1 }).startOf('day');
  } else if (month) {
    from = baseDate.startOf('month');
    to = baseDate.plus({ months: 1 }).startOf('month');
  } else {
    from = baseDate.startOf('year');
    to = baseDate.plus({ years: 1 }).startOf('year');
  }

  return {
    from: from.toISO() || undefined,
    to: to.toISO() || undefined,
  };
};
