import type { AssetBucket } from '$lib/stores/assets.store';
import { locale } from '$lib/stores/preferences.store';
import type { JustifiedLayout } from '@immich/justified-layout-wasm';
import type { AssetResponseDto } from '@immich/sdk';
import { groupBy, memoize, sortBy } from 'lodash-es';
import { DateTime } from 'luxon';
import { get } from 'svelte/store';

export type DateGroup = {
  date: DateTime;
  groupTitle: string;
  assets: AssetResponseDto[];
  height: number;
  heightActual: boolean;
  intersecting: boolean;
  geometry: JustifiedLayout | null;
  bucket: AssetBucket;
};
export type ScrubberListener = (
  bucketDate: string | undefined,
  overallScrollPercent: number,
  bucketScrollPercent: number,
) => void | Promise<void>;
export type ScrollTargetListener = ({
  bucket,
  dateGroup,
  asset,
  offset,
}: {
  bucket: AssetBucket;
  dateGroup: DateGroup;
  asset: AssetResponseDto;
  offset: number;
}) => void;

export const fromLocalDateTime = (localDateTime: string) =>
  DateTime.fromISO(localDateTime, { zone: 'UTC', locale: get(locale) });

export const fromDateTimeOriginal = (dateTimeOriginal: string, timeZone: string) =>
  DateTime.fromISO(dateTimeOriginal, { zone: timeZone });

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
  if (date >= today.minus({ days: 6 }) && date < today) {
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

const formatDateGroupTitle = memoize(formatGroupTitle);

export function splitBucketIntoDateGroups(bucket: AssetBucket, locale: string | undefined): DateGroup[] {
  const grouped = groupBy(bucket.assets, (asset) =>
    fromLocalDateTime(asset.localDateTime).toLocaleString(groupDateFormat, { locale }),
  );
  const sorted = sortBy(grouped, (group) => bucket.assets.indexOf(group[0]));

  return sorted.map((group) => {
    const date = fromLocalDateTime(group[0].localDateTime).startOf('day');
    return {
      date,
      groupTitle: formatDateGroupTitle(date),
      assets: group,
      height: 0,
      heightActual: false,
      intersecting: false,
      geometry: null,
      bucket,
    };
  });
}

export function findTotalOffset(element: HTMLElement, stop: HTMLElement) {
  let offset = 0;
  while (element.offsetParent && element !== stop) {
    offset += element.offsetTop;
    element = element.offsetParent as HTMLElement;
  }
  return offset;
}
