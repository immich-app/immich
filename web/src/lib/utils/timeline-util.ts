import type { AssetBucket, TimelineAsset } from '$lib/stores/assets-store.svelte';
import { locale } from '$lib/stores/preferences.store';
import { getAssetRatio } from '$lib/utils/asset-utils';
import { type CommonJustifiedLayout } from '$lib/utils/layout-utils';

import { AssetTypeEnum, type AssetResponseDto } from '@immich/sdk';
import { memoize } from 'lodash-es';
import { DateTime, type LocaleOptions } from 'luxon';
import { get } from 'svelte/store';

export type DateGroup = {
  bucket: AssetBucket;
  index: number;
  row: number;
  col: number;
  date: DateTime;
  groupTitle: string;
  assets: AssetResponseDto[];
  assetsIntersecting: boolean[];
  height: number;
  intersecting: boolean;
  geometry: CommonJustifiedLayout;
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

export type LayoutBox = {
  aspectRatio: number;
  top: number;
  width: number;
  height: number;
  left: number;
  forcedAspectRatio?: boolean;
};

export function findTotalOffset(element: HTMLElement, stop: HTMLElement) {
  let offset = 0;
  while (element.offsetParent && element !== stop) {
    offset += element.offsetTop;
    element = element.offsetParent as HTMLElement;
  }
  return offset;
}

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

  return getDateLocaleString(date);
}
export const getDateLocaleString = (date: DateTime, opts?: LocaleOptions): string =>
  date.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY, opts);

export const formatDateGroupTitle = memoize(formatGroupTitle);

export const toTimelineAsset = (unknownAsset: AssetResponseDto | TimelineAsset): TimelineAsset => {
  if (isTimelineAsset(unknownAsset)) {
    return unknownAsset;
  }
  const assetResponse = unknownAsset as AssetResponseDto;
  const { width, height } = getAssetRatio(assetResponse);
  const ratio = width / height;
  return {
    id: assetResponse.id,
    ownerId: assetResponse.ownerId,
    ratio,
    thumbhash: assetResponse.thumbhash,
    localDateTime: assetResponse.localDateTime,
    isFavorite: assetResponse.isFavorite,
    isArchived: assetResponse.isArchived,
    isTrashed: assetResponse.isTrashed,
    isVideo: assetResponse.type == AssetTypeEnum.Video,
    isImage: assetResponse.type == AssetTypeEnum.Image,
    stack: assetResponse.stack || null,
    duration: assetResponse.duration || null,
    projectionType: assetResponse.exifInfo?.projectionType || null,
    livePhotoVideoId: assetResponse.livePhotoVideoId || null,
  };
};
export const isTimelineAsset = (arg: AssetResponseDto | TimelineAsset): arg is TimelineAsset =>
  (arg as TimelineAsset).ratio !== undefined;
