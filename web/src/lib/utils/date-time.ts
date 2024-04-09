import { locale } from '$lib/stores/preferences.store';
import { DateTime, Duration } from 'luxon';
import { get } from 'svelte/store';

/**
 * Convert time like `01:02:03.456` to seconds.
 */
export function timeToSeconds(time: string) {
  const parts = time.split(':');
  parts[2] = parts[2].split('.').slice(0, 2).join('.');

  const [hours, minutes, seconds] = parts.map(Number);

  return Duration.fromObject({ hours, minutes, seconds }).as('seconds');
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
