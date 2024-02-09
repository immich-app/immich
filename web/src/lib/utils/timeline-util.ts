import type { AssetResponseDto } from '@api';
import { groupBy, sortBy } from 'lodash-es';
import { DateTime, Interval } from 'luxon';

export const fromLocalDateTime = (localDateTime: string) => DateTime.fromISO(localDateTime, { zone: 'UTC' });

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
  const grouped = groupBy(assets, (asset) =>
    fromLocalDateTime(asset.localDateTime).toLocaleString(groupDateFormat, { locale }),
  );
  return sortBy(grouped, (group) => assets.indexOf(group[0]));
}
