import { DateTime } from 'luxon';
import { isoDateToDate, isoDatetimeToDate } from 'src/validation';

/**
 * Convert a date to a ISO 8601 datetime string.
 */
export const asDateTimeString = <T extends Date | string | undefined | null>(x: T) => {
  return x instanceof Date ? isoDatetimeToDate.encode(x) : (x as Exclude<T, Date>);
};

/**
 * Convert a date to a date string (yyyy-mm-dd).
 */
export const asDateString = (x: Date | string | null): string | null => {
  return x instanceof Date ? isoDateToDate.encode(x) : x;
};

export const extractTimeZone = (dateTimeOriginal?: string | null) => {
  const extractedTimeZone = dateTimeOriginal ? DateTime.fromISO(dateTimeOriginal, { setZone: true }).zone : undefined;
  return extractedTimeZone?.type === 'fixed' ? extractedTimeZone : undefined;
};

export const mergeTimeZone = (dateTimeOriginal?: string | null, timeZone?: string | null) => {
  return dateTimeOriginal
    ? DateTime.fromISO(dateTimeOriginal, { zone: 'UTC' }).setZone(timeZone ?? undefined)
    : undefined;
};
