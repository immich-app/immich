import { dateFormats } from '$lib/constants';
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

export const dateLocaleString = (dateString: string) => {
  return new Date(dateString).toLocaleDateString(get(locale), dateFormats.album);
};
