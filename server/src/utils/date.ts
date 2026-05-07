import { DateTime } from 'luxon';

/**
 * Convert a date to a ISO 8601 datetime string.
 * @param x - The date to convert.
 * @returns The ISO 8601 datetime string.
 * @deprecated Remove this and all references when using `ZodSerializerDto` on the controllers. Then the codec in `isoDatetimeToDate` in validation.ts will handle the conversion instead.
 */
export const asDateString = <T extends Date | string | undefined | null>(x: T) => {
  return x instanceof Date ? x.toISOString() : (x as Exclude<T, Date>);
};

/**
 * Convert a date to a date string.
 * @param x - The date to convert.
 * @returns The date string.
 * @deprecated Remove this and all references when using `ZodSerializerDto` on the controllers. Then the codec in `isoDateToDate` in validation.ts will handle the conversion instead.
 */
export const asBirthDateString = (x: Date | string | null): string | null => {
  return x instanceof Date ? x.toISOString().split('T')[0] : x;
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
