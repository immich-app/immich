import { locale } from '$lib/stores/preferences.store';
import type { AssetResponseDto } from '@immich/sdk';
import { groupBy, sortBy } from 'lodash-es';
import { DateTime } from 'luxon';
import { get } from 'svelte/store';

export const fromLocalDateTime = (localDateTime: string) =>
  DateTime.fromISO(localDateTime, { zone: 'UTC', locale: get(locale) });

export const groupDateFormat: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};

export function formatGroupTitle(_date: DateTime): string {
  if (!_date.isValid) {
    return _date.toString();
  }
  const date = _date as DateTime<true>;
  const today = DateTime.now().startOf('day');

  // Today
  if (today.hasSame(date, 'day')) {
    return date.toRelativeCalendar();
  }

  // Yesterday
  if (today.minus({ days: 1 }).hasSame(date, 'day')) {
    return date.toRelativeCalendar();
  }

  // Last week
  if (date >= today.minus({ days: 6 })) {
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

export type LayoutBox = {
  top: number;
  left: number;
  width: number;
};

export function calculateWidth(boxes: LayoutBox[]): number {
  let width = 0;
  for (const box of boxes) {
    if (box.top < 100) {
      width = box.left + box.width;
    }
  }

  return width;
}
