import type { AssetResponseDto } from '@api';
import lodash from 'lodash-es';
import { DateTime, Interval } from 'luxon';

export const groupDateFormat: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};

export function formatGroupTitle(date: DateTime): string {
  const today = DateTime.now().startOf('day');

  // Today
  if (today.hasSame(date, 'day')) {
    return 'Today';
  }

  // Yesterday
  if (Interval.fromDateTimes(date, today).length('days') == 1) {
    return 'Yesterday';
  }

  // Last week
  if (Interval.fromDateTimes(date, today).length('weeks') < 1) {
    return date.toLocaleString({ weekday: 'long' });
  }

  // This year
  if (today.hasSame(date, 'year')) {
    return date.toLocaleString({
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  return date.toLocaleString(groupDateFormat);
}

export function splitBucketIntoDateGroups(
  assets: AssetResponseDto[],
  locale: string | undefined,
): AssetResponseDto[][] {
  return lodash
    .chain(assets)
    .groupBy((a) => new Date(a.fileCreatedAt).toLocaleDateString(locale, groupDateFormat))
    .sortBy((group) => assets.indexOf(group[0]))
    .value();
}
