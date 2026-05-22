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

export const getShortDateRange = (startTimestamp: string, endTimestamp: string) => {
  const userLocale = get(locale);
  let startDate = DateTime.fromISO(startTimestamp).setZone('UTC');
  let endDate = DateTime.fromISO(endTimestamp).setZone('UTC');

  if (userLocale) {
    startDate = startDate.setLocale(userLocale);
    endDate = endDate.setLocale(userLocale);
  }

  const endDateLocalized = endDate.toLocaleString({
    month: 'short',
    year: 'numeric',
  });

  if (startDate.year === endDate.year) {
    if (startDate.month === endDate.month) {
      // Same year and month.
      // e.g.: aug. 2024
      return endDateLocalized;
    } else {
      // Same year but different month.
      // e.g.: jul. - sept. 2024
      const startMonthLocalized = startDate.toLocaleString({
        month: 'short',
      });
      return `${startMonthLocalized} - ${endDateLocalized}`;
    }
  } else {
    // Different year.
    // e.g.: feb. 2021 - sept. 2024
    const startDateLocalized = startDate.toLocaleString({
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
