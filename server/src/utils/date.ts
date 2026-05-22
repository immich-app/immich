import { DateTime } from 'luxon';

export const asDateString = <T extends Date | string | undefined | null>(x: T) => {
  return x instanceof Date ? x.toISOString() : (x as Exclude<T, Date>);
};

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
