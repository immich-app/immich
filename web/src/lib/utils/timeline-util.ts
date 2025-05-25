import type { TimelineAsset } from '$lib/stores/assets-store.svelte';
import { locale } from '$lib/stores/preferences.store';
import { getAssetRatio } from '$lib/utils/asset-utils';
import { AssetTypeEnum, type AssetResponseDto } from '@immich/sdk';
import { DateTime, type LocaleOptions } from 'luxon';
import { get } from 'svelte/store';

export type ScrubberListener = (
  bucketDate: { year: number; month: number },
  overallScrollPercent: number,
  bucketScrollPercent: number,
) => void | Promise<void>;

export const fromLocalDateTime = (localDateTime: string) =>
  DateTime.fromISO(localDateTime, { zone: 'UTC', locale: get(locale) });

export const fromLocalDateTimeToObject = (localDateTime: string): TimelinePlainDateTime =>
  (fromLocalDateTime(localDateTime) as DateTime<true>).toObject();

export const fromTimelinePlainDateTime = (timelineDateTime: TimelinePlainDateTime): DateTime<true> =>
  DateTime.fromObject(timelineDateTime, { zone: 'local', locale: get(locale) }) as DateTime<true>;

export const fromTimelinePlainDate = (timelineYearMonth: TimelinePlainDate): DateTime<true> =>
  DateTime.fromObject(
    { year: timelineYearMonth.year, month: timelineYearMonth.month, day: timelineYearMonth.day },
    { zone: 'local', locale: get(locale) },
  ) as DateTime<true>;

export const fromTimelinePlainYearMonth = (timelineYearMonth: TimelinePlainYearMonth): DateTime<true> =>
  DateTime.fromObject(
    { year: timelineYearMonth.year, month: timelineYearMonth.month },
    { zone: 'local', locale: get(locale) },
  ) as DateTime<true>;

export const fromDateTimeOriginal = (dateTimeOriginal: string, timeZone: string) =>
  DateTime.fromISO(dateTimeOriginal, { zone: timeZone, locale: get(locale) });

export const toISOLocalDateTime = (timelineYearMonth: TimelinePlainYearMonth): string =>
  (fromTimelinePlainYearMonth(timelineYearMonth).setZone('UTC', { keepLocalTime: true }) as DateTime<true>).toISO();

export const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth());

export function formatBucketTitle(_date: DateTime): string {
  if (!_date.isValid) {
    return _date.toString();
  }
  const date = _date as DateTime<true>;
  return date.toLocaleString(
    {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    },
    { locale: get(locale) },
  );
}

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
    return date.toLocaleString({ weekday: 'long' }, { locale: get(locale) });
  }

  // This year
  if (today.hasSame(date, 'year')) {
    return date.toLocaleString(
      {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      },
      { locale: get(locale) },
    );
  }

  return getDateLocaleString(date, { locale: get(locale) });
}

export const getDateLocaleString = (date: DateTime, opts?: LocaleOptions): string =>
  date.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY, opts);

export const toTimelineAsset = (unknownAsset: AssetResponseDto | TimelineAsset): TimelineAsset => {
  if (isTimelineAsset(unknownAsset)) {
    return unknownAsset;
  }
  const assetResponse = unknownAsset;
  const { width, height } = getAssetRatio(assetResponse);
  const ratio = width / height;
  const city = assetResponse.exifInfo?.city;
  const country = assetResponse.exifInfo?.country;
  const people = assetResponse.people?.map((person) => person.name) || [];

  return {
    id: assetResponse.id,
    ownerId: assetResponse.ownerId,
    ratio,
    thumbhash: assetResponse.thumbhash,
    localDateTime: fromLocalDateTimeToObject(assetResponse.localDateTime),
    isFavorite: assetResponse.isFavorite,
    visibility: assetResponse.visibility,
    isTrashed: assetResponse.isTrashed,
    isVideo: assetResponse.type == AssetTypeEnum.Video,
    isImage: assetResponse.type == AssetTypeEnum.Image,
    stack: assetResponse.stack || null,
    duration: assetResponse.duration || null,
    projectionType: assetResponse.exifInfo?.projectionType || null,
    livePhotoVideoId: assetResponse.livePhotoVideoId || null,
    city: city || null,
    country: country || null,
    people,
  };
};

export const isTimelineAsset = (unknownAsset: AssetResponseDto | TimelineAsset): unknownAsset is TimelineAsset =>
  (unknownAsset as TimelineAsset).ratio !== undefined;

export const plainDateTimeCompare = (ascending: boolean, a: TimelinePlainDateTime, b: TimelinePlainDateTime) => {
  const [aDateTime, bDateTime] = ascending ? [a, b] : [b, a];

  if (aDateTime.year !== bDateTime.year) {
    return aDateTime.year - bDateTime.year;
  }
  if (aDateTime.month !== bDateTime.month) {
    return aDateTime.month - bDateTime.month;
  }
  if (aDateTime.day !== bDateTime.day) {
    return aDateTime.day - bDateTime.day;
  }
  if (aDateTime.hour !== bDateTime.hour) {
    return aDateTime.hour - bDateTime.hour;
  }
  if (aDateTime.minute !== bDateTime.minute) {
    return aDateTime.minute - bDateTime.minute;
  }
  if (aDateTime.second !== bDateTime.second) {
    return aDateTime.second - bDateTime.second;
  }
  return aDateTime.millisecond - bDateTime.millisecond;
};

export type TimelinePlainDateTime = TimelinePlainDate & {
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
};

export type TimelinePlainDate = TimelinePlainYearMonth & {
  day: number;
};

export type TimelinePlainYearMonth = {
  year: number;
  month: number;
};
