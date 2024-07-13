import { locale } from '$lib/stores/preferences.store';
import type { AssetResponseDto } from '@immich/sdk';
import type createJustifiedLayout from 'justified-layout';
import { groupBy, memoize, sortBy } from 'lodash-es';
import { DateTime, Interval } from 'luxon';
import { get } from 'svelte/store';

export const fromLocalDateTime = (localDateTime: string) =>
  DateTime.fromISO(localDateTime, { zone: 'UTC', locale: get(locale) });

export const groupDateFormat: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};

const dates = {};
const count = 0;

export function formatGroupTitle(date: DateTime): string {
  // const d = date.toString();
  // if (dates[d]) {
  //     console.log('Could be cached', ++count);
  //   }
  //   dates[d] = date;

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

export type DateGroup = {
  date: DateTime;
  groupTitle: string;
  assets: AssetResponseDto[];
  height: number;
  heightActual: boolean;
  intersecting: boolean;
  geometry: Geometry;
};

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

export function splitBucketIntoDateGroups(assets: AssetResponseDto[], locale: string | undefined): DateGroup[] {
  const grouped = groupBy(assets, (asset) =>
    fromLocalDateTime(asset.localDateTime).toLocaleString(groupDateFormat, { locale }),
  );
  const sorted = sortBy(grouped, (group) => assets.indexOf(group[0]));
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
