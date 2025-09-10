import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { locale } from '$lib/stores/preferences.store';
import { getAssetRatio } from '$lib/utils/asset-utils';
import { AssetTypeEnum, type AssetResponseDto } from '@immich/sdk';
import { DateTime, type LocaleOptions } from 'luxon';
import { SvelteSet } from 'svelte/reactivity';
import { get } from 'svelte/store';

// Move type definitions to the top
export type TimelineYearMonth = {
  year: number;
  month: number;
};

export type TimelineDate = TimelineYearMonth & {
  day: number;
};

export type TimelineDateTime = TimelineDate & {
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
};

export type ScrubberListener = (
  scrubberMonth: { year: number; month: number },
  overallScrollPercent: number,
  scrubberMonthScrollPercent: number,
) => void | Promise<void>;

// used for AssetResponseDto.dateTimeOriginal, amongst others
export const fromISODateTime = (isoDateTime: string, timeZone: string): DateTime<true> =>
  DateTime.fromISO(isoDateTime, { zone: timeZone, locale: get(locale) }) as DateTime<true>;

export const fromISODateTimeToObject = (isoDateTime: string, timeZone: string): TimelineDateTime =>
  (fromISODateTime(isoDateTime, timeZone) as DateTime<true>).toObject();

// used for AssetResponseDto.localDateTime, amongst others
export const fromISODateTimeUTC = (isoDateTimeUtc: string) => fromISODateTime(isoDateTimeUtc, 'UTC');

export const fromISODateTimeUTCToObject = (isoDateTimeUtc: string): TimelineDateTime =>
  (fromISODateTimeUTC(isoDateTimeUtc) as DateTime<true>).toObject();

// used to create equivalent of AssetResponseDto.localDateTime in UTC, but without timezone information
export const fromISODateTimeTruncateTZToObject = (
  isoDateTimeUtc: string,
  timeZone: string | undefined,
): TimelineDateTime =>
  (
    fromISODateTime(isoDateTimeUtc, timeZone ?? 'UTC').setZone('UTC', { keepLocalTime: true }) as DateTime<true>
  ).toObject();

// Used to derive a local date time from an ISO string and a UTC offset in hours
export const fromISODateTimeWithOffsetToObject = (isoDateTimeUtc: string, utcOffsetHours: number): TimelineDateTime => {
  const utcDateTime = fromISODateTimeUTC(isoDateTimeUtc);

  // Apply the offset to get the local time
  // Note: offset is in hours (may be fractional), positive for east of UTC, negative for west
  const localDateTime = utcDateTime.plus({ hours: utcOffsetHours });

  // Return as plain object (keeping the local time but in UTC zone context)
  return (localDateTime.setZone('UTC', { keepLocalTime: true }) as DateTime<true>).toObject();
};

export const getTimes = (isoDateTimeUtc: string, localUtcOffsetHours: number) => {
  const utcDateTime = fromISODateTimeUTC(isoDateTimeUtc);
  const fileCreatedAt = (utcDateTime as DateTime<true>).toObject();

  // Apply the offset to get the local time
  // Note: offset is in hours (may be fractional), positive for east of UTC, negative for west
  const luxonLocalDateTime = utcDateTime.plus({ hours: localUtcOffsetHours });
  // Return as plain object (keeping the local time but in UTC zone context)
  const localDateTime = (luxonLocalDateTime.setZone('UTC', { keepLocalTime: true }) as DateTime<true>).toObject();

  return {
    fileCreatedAt,
    localDateTime,
  };
};

export const fromTimelinePlainDateTime = (timelineDateTime: TimelineDateTime): DateTime<true> =>
  DateTime.fromObject(timelineDateTime, { zone: 'local', locale: get(locale) }) as DateTime<true>;

export const fromTimelinePlainDate = (timelineYearMonth: TimelineDate): DateTime<true> =>
  DateTime.fromObject(
    { year: timelineYearMonth.year, month: timelineYearMonth.month, day: timelineYearMonth.day },
    { zone: 'local', locale: get(locale) },
  ) as DateTime<true>;

export const fromTimelinePlainYearMonth = (timelineYearMonth: TimelineYearMonth): DateTime<true> =>
  DateTime.fromObject(
    { year: timelineYearMonth.year, month: timelineYearMonth.month },
    { zone: 'local', locale: get(locale) },
  ) as DateTime<true>;

export const toISOYearMonthUTC = ({ year, month }: TimelineYearMonth): string =>
  `${year}-${month.toString().padStart(2, '0')}-01T00:00:00.000Z`;

export function formatMonthGroupTitle(_date: DateTime): string {
  if (!_date.isValid) {
    return _date.toString();
  }
  const date = _date as DateTime<true>;
  return date.toLocaleString(
    {
      month: 'short',
      year: 'numeric',
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
    return date.toRelativeCalendar({ locale: get(locale) });
  }

  // Yesterday
  if (today.minus({ days: 1 }).hasSame(date, 'day')) {
    return date.toRelativeCalendar({ locale: get(locale) });
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

export const getDateTimeOffsetLocaleString = (date: DateTime, opts?: LocaleOptions): string =>
  date.toLocaleString(
    { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'longOffset' },
    opts,
  );

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

  const localDateTime = fromISODateTimeUTCToObject(assetResponse.localDateTime);
  const fileCreatedAt = fromISODateTimeToObject(assetResponse.fileCreatedAt, assetResponse.exifInfo?.timeZone ?? 'UTC');

  return {
    id: assetResponse.id,
    ownerId: assetResponse.ownerId,
    ratio,
    thumbhash: assetResponse.thumbhash,
    localDateTime,
    fileCreatedAt,
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
    latitude: assetResponse.exifInfo?.latitude || null,
    longitude: assetResponse.exifInfo?.longitude || null,
  };
};

export const isTimelineAsset = (unknownAsset: AssetResponseDto | TimelineAsset): unknownAsset is TimelineAsset =>
  (unknownAsset as TimelineAsset).ratio !== undefined;

export const plainDateTimeCompare = (ascending: boolean, a: TimelineDateTime, b: TimelineDateTime) => {
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

export function setDifference<T>(setA: Set<T>, setB: Set<T>): SvelteSet<T> {
  const result = new SvelteSet<T>();
  for (const value of setA) {
    if (!setB.has(value)) {
      result.add(value);
    }
  }
  return result;
}
