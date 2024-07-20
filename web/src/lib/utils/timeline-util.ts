import type { AssetBucket } from '$lib/stores/assets.store';
import { locale } from '$lib/stores/preferences.store';
import type { AssetResponseDto } from '@immich/sdk';
import type createJustifiedLayout from 'justified-layout';
import { groupBy, memoize, sortBy } from 'lodash-es';
import { DateTime, Interval } from 'luxon';
import { get } from 'svelte/store';

export type DateGroup = {
  date: DateTime;
  groupTitle: string;
  assets: AssetResponseDto[];
  height: number;
  heightActual: boolean;
  intersecting: boolean;
  geometry: Geometry;
  bucket: AssetBucket;
};
export type ScrollBarListener = (
  bucketDate: string | undefined,
  overallScrollPercent: number,
  bucketScrollPercent: number,
) => void;

export const fromLocalDateTime = (localDateTime: string) =>
  DateTime.fromISO(localDateTime, { zone: 'UTC', locale: get(locale) });

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

type Geometry = ReturnType<typeof createJustifiedLayout> & {
  containerWidth: number;
};

function emptyGeometry() {
  return {
    containerWidth: 0,
    containerHeight: 0,
    widowCount: 0,
    boxes: [],
  };
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
      geometry: emptyGeometry(),
      bucket: bucket,
    };
  });
}

export type LayoutBox = {
  aspectRatio: number;
  top: number;
  width: number;
  height: number;
  left: number;
  forcedAspectRatio?: boolean;
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

export function findTotalOffset(element: HTMLElement, stop: HTMLElement) {
  let offset = 0;
  while (element.offsetParent && element !== stop) {
    offset += element.offsetTop;
    element = element.offsetParent as HTMLElement;
  }
  return offset;
}
