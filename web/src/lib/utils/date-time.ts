import { DateTime, Duration } from 'luxon';

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
