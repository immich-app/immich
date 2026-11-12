import { eventManager } from '#lib/managers/event-manager.svelte.ts';
import { getTimelineMonthByDate } from '#lib/managers/timeline-manager/internal/search-support.svelte.ts';
import { fromISODateTimeUTCToObject, fromTimelinePlainDateTime } from '#lib/utils/timeline-util.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import type { Mock } from '#test/unit/mocks/mock.ts';
import {
  AssetOrderBy,
  AssetVisibility,
  type AssetResponseDto,
  type TimeBucketAssetResponseDto,
  type TimeBucketsResponseDto,
} from '@immich/sdk';
import { Settings } from 'luxon';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';
import { TimelineManager } from './timeline-manager.svelte';
import type { TimelineAsset } from './types';

async function getAssets(timelineManager: TimelineManager) {
  const assets = [];
  for await (const asset of timelineManager.assetsIterator()) {
    assets.push(asset);
  }
  return assets;
}

const toResponseDto = (...timelineAsset: TimelineAsset[]) => {
  const bucketAssets: TimeBucketAssetResponseDto = {
    city: [],
    country: [],
    duration: [],
    id: [],
    visibility: [],
    isFavorite: [],
    isImage: [],
    isTrashed: [],
    livePhotoVideoId: [],
    fileCreatedAt: [],
    localOffsetHours: [],
    createdAt: [],
    ownerId: [],
    projectionType: [],
    ratio: [],
    stack: [],
    thumbhash: [],
  };
  for (const asset of timelineAsset) {
    const fileCreatedAt = fromTimelinePlainDateTime(asset.fileCreatedAt).toISO();
    bucketAssets.city?.push(asset.city);
    bucketAssets.country?.push(asset.country);
    bucketAssets.duration.push(asset.duration!);
    bucketAssets.id.push(asset.id);
    bucketAssets.visibility.push(asset.visibility);
    bucketAssets.isFavorite.push(asset.isFavorite);
    bucketAssets.isImage.push(asset.isImage);
    bucketAssets.isTrashed.push(asset.isTrashed);
    bucketAssets.livePhotoVideoId.push(asset.livePhotoVideoId!);
    bucketAssets.fileCreatedAt.push(fileCreatedAt);
    bucketAssets.ownerId.push(asset.ownerId);
    bucketAssets.projectionType.push(asset.projectionType!);
    bucketAssets.ratio.push(asset.ratio);
    bucketAssets.stack?.push(asset.stack ? [asset.stack.id, asset.stack.assetCount.toString()] : null);
    bucketAssets.thumbhash.push(asset.thumbhash!);
  }

  return bucketAssets;
};

function deriveLocalDateTimeFromFileCreatedAt(arg: TimelineAsset): TimelineAsset {
  return {
    ...arg,
    localDateTime: arg.fileCreatedAt,
  };
}

type Context = { api: Mock['api'] };

const mockTimeBuckets = (
  api: Mock['api'],
  timeBuckets: TimeBucketsResponseDto[],
  bucketAssetsResponse: Record<string, TimeBucketAssetResponseDto>,
) =>
  api.on({
    getTimeBuckets: () => ({ json: timeBuckets }),
    getTimeBucket: ({ params }) => ({ json: bucketAssetsResponse[params.timeBucket] }),
  });

describe('TimelineManager', () => {
  describe('init', () => {
    let timelineManager: TimelineManager;

    beforeEach<Context>(async ({ api }) => {
      timelineManager = new TimelineManager();
      api.on({
        getTimeBuckets: () => ({
          json: [
            { count: 1, timeBucket: '2024-03-01' },
            { count: 100, timeBucket: '2024-02-01' },
            { count: 3, timeBucket: '2024-01-01' },
          ],
        }),
        getTimeBucket: () => new Promise(() => {}),
      });
      await timelineManager.updateViewport({ width: 1588, height: 1000 });
      await tick();
    });

    test('should load months in viewport', ({ api }) => {
      expect(api.getTimeBuckets.calls).toHaveLength(1);
      expect(api.getTimeBucket.calls).toHaveLength(2);
    });

    test('calculates month height', () => {
      const plainMonths = timelineManager.months.map((month) => ({
        year: month.yearMonth.year,
        month: month.yearMonth.month,
        height: month.height,
      }));

      expect(plainMonths).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ year: 2024, month: 3, height: 283 }),
          expect.objectContaining({ year: 2024, month: 2, height: 3808 }),
          expect.objectContaining({ year: 2024, month: 1, height: 283 }),
        ]),
      );
    });

    test('calculates timeline height', () => {
      expect(timelineManager.totalViewerHeight).toBe(4434);
    });
  });

  describe('loadTimelineMonth', () => {
    let timelineManager: TimelineManager;
    const bucketAssets: Record<string, TimelineAsset[]> = {
      '2024-01-03T00:00:00.000Z': factory
        .many(1, () => factory.timelineAsset())
        .map((asset) =>
          deriveLocalDateTimeFromFileCreatedAt({
            ...asset,
            fileCreatedAt: fromISODateTimeUTCToObject('2024-03-01T00:00:00.000Z'),
          }),
        ),
      '2024-01-01T00:00:00.000Z': factory
        .many(3, () => factory.timelineAsset())
        .map((asset) =>
          deriveLocalDateTimeFromFileCreatedAt({
            ...asset,
            fileCreatedAt: fromISODateTimeUTCToObject('2024-01-01T00:00:00.000Z'),
          }),
        ),
    };
    const bucketAssetsResponse: Record<string, TimeBucketAssetResponseDto> = Object.fromEntries(
      Object.entries(bucketAssets).map(([key, assets]) => [key, toResponseDto(...assets)]),
    );
    beforeEach<Context>(async ({ api }) => {
      timelineManager = new TimelineManager();
      mockTimeBuckets(
        api,
        [
          { count: 1, timeBucket: '2024-03-01T00:00:00.000Z' },
          { count: 3, timeBucket: '2024-01-01T00:00:00.000Z' },
        ],
        bucketAssetsResponse,
      );
      await timelineManager.updateViewport({ width: 1588, height: 0 });
    });

    test('loads a month', async ({ api }) => {
      expect(getTimelineMonthByDate(timelineManager, { year: 2024, month: 1 })?.getAssets().length).toEqual(0);
      await timelineManager.loadTimelineMonth({ year: 2024, month: 1 });
      expect(api.getTimeBucket.calls).toHaveLength(1);
      expect(getTimelineMonthByDate(timelineManager, { year: 2024, month: 1 })?.getAssets().length).toEqual(3);
    });

    test('ignores invalid months', async ({ api }) => {
      await timelineManager.loadTimelineMonth({ year: 2023, month: 1 });
      expect(api.getTimeBucket).not.toHaveBeenCalled();
    });

    test('cancels month loading', async () => {
      const month = getTimelineMonthByDate(timelineManager, { year: 2024, month: 1 })!;
      void timelineManager.loadTimelineMonth({ year: 2024, month: 1 });
      const abortSpy = vi.spyOn(month!.loader!.cancelToken!, 'abort');
      month?.cancel();
      expect(abortSpy).toHaveBeenCalledOnce();
      await timelineManager.loadTimelineMonth({ year: 2024, month: 1 });
      expect(getTimelineMonthByDate(timelineManager, { year: 2024, month: 1 })?.getAssets().length).toEqual(3);
    });

    test('prevents loading months multiple times', async ({ api }) => {
      await Promise.all([
        timelineManager.loadTimelineMonth({ year: 2024, month: 1 }),
        timelineManager.loadTimelineMonth({ year: 2024, month: 1 }),
      ]);
      expect(api.getTimeBucket.calls).toHaveLength(1);

      await timelineManager.loadTimelineMonth({ year: 2024, month: 1 });
      expect(api.getTimeBucket.calls).toHaveLength(1);
    });

    test('allows loading a canceled month', async () => {
      const month = getTimelineMonthByDate(timelineManager, { year: 2024, month: 1 })!;
      const loadPromise = timelineManager.loadTimelineMonth({ year: 2024, month: 1 });

      month.cancel();
      await loadPromise;
      expect(month?.getAssets().length).toEqual(0);

      await timelineManager.loadTimelineMonth({ year: 2024, month: 1 });
      expect(month!.getAssets().length).toEqual(3);
    });
  });

  describe('loadTimelineMonth ordered by upload date', () => {
    afterEach(() => {
      Settings.defaultZone = 'system';
    });

    test('groups recently added assets by the local upload day', async ({ api }) => {
      Settings.defaultZone = 'Pacific/Auckland';
      const asset = factory.timelineAsset({ fileCreatedAt: fromISODateTimeUTCToObject('2024-01-05T12:00:00.000Z') });
      mockTimeBuckets(api, [{ count: 1, timeBucket: '2024-01-01T00:00:00.000Z' }], {
        '2024-01-01T00:00:00.000Z': { ...toResponseDto(asset), createdAt: ['2024-01-10T23:30:00.000Z'] },
      });
      const timelineManager = new TimelineManager();
      await timelineManager.updateOptions({ orderBy: AssetOrderBy.CreatedAt });

      await timelineManager.loadTimelineMonth({ year: 2024, month: 1 });

      const month = getTimelineMonthByDate(timelineManager, { year: 2024, month: 1 });
      expect(month?.timelineDays.map(({ day }) => day)).toEqual([11]);
    });
  });

  describe('upsertAssets', () => {
    let timelineManager: TimelineManager;

    beforeEach<Context>(async ({ api }) => {
      timelineManager = new TimelineManager();
      api.on({ getTimeBuckets: () => ({ json: [] }) });

      await timelineManager.updateViewport({ width: 1588, height: 1000 });
    });

    test('is empty initially', () => {
      expect(timelineManager.months.length).toEqual(0);
      expect(timelineManager.assetCount).toEqual(0);
    });

    test('adds assets to new month', () => {
      const asset = deriveLocalDateTimeFromFileCreatedAt(
        factory.timelineAsset({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
        }),
      );
      timelineManager.upsertAssets([asset]);

      expect(timelineManager.months.length).toEqual(1);
      expect(timelineManager.assetCount).toEqual(1);
      expect(timelineManager.months[0].getAssets().length).toEqual(1);
      expect(timelineManager.months[0].yearMonth.year).toEqual(2024);
      expect(timelineManager.months[0].yearMonth.month).toEqual(1);
      expect(timelineManager.months[0].getFirstAsset().id).toEqual(asset.id);
    });

    test('adds assets to existing month', () => {
      const [assetOne, assetTwo] = factory
        .many(2, () =>
          factory.timelineAsset({
            fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
          }),
        )
        .map((asset) => deriveLocalDateTimeFromFileCreatedAt(asset));
      timelineManager.upsertAssets([assetOne]);
      timelineManager.upsertAssets([assetTwo]);

      expect(timelineManager.months.length).toEqual(1);
      expect(timelineManager.assetCount).toEqual(2);
      expect(timelineManager.months[0].getAssets().length).toEqual(2);
      expect(timelineManager.months[0].yearMonth.year).toEqual(2024);
      expect(timelineManager.months[0].yearMonth.month).toEqual(1);
    });

    test('orders assets in months by descending date', () => {
      const assetOne = deriveLocalDateTimeFromFileCreatedAt(
        factory.timelineAsset({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
        }),
      );
      const assetTwo = deriveLocalDateTimeFromFileCreatedAt(
        factory.timelineAsset({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-15T12:00:00.000Z'),
        }),
      );
      const assetThree = deriveLocalDateTimeFromFileCreatedAt(
        factory.timelineAsset({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-16T12:00:00.000Z'),
        }),
      );
      timelineManager.upsertAssets([assetOne, assetTwo, assetThree]);

      const month = getTimelineMonthByDate(timelineManager, { year: 2024, month: 1 });
      expect(month).not.toBeNull();
      expect(month?.getAssets().length).toEqual(3);
      expect(month?.getAssets()[0].id).toEqual(assetOne.id);
      expect(month?.getAssets()[1].id).toEqual(assetThree.id);
      expect(month?.getAssets()[2].id).toEqual(assetTwo.id);
    });

    test('orders months by descending date', () => {
      const assetOne = deriveLocalDateTimeFromFileCreatedAt(
        factory.timelineAsset({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
        }),
      );
      const assetTwo = deriveLocalDateTimeFromFileCreatedAt(
        factory.timelineAsset({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-04-20T12:00:00.000Z'),
        }),
      );
      const assetThree = deriveLocalDateTimeFromFileCreatedAt(
        factory.timelineAsset({
          fileCreatedAt: fromISODateTimeUTCToObject('2023-01-20T12:00:00.000Z'),
        }),
      );
      timelineManager.upsertAssets([assetOne, assetTwo, assetThree]);

      expect(timelineManager.months.length).toEqual(3);
      expect(timelineManager.months[0].yearMonth.year).toEqual(2024);
      expect(timelineManager.months[0].yearMonth.month).toEqual(4);

      expect(timelineManager.months[1].yearMonth.year).toEqual(2024);
      expect(timelineManager.months[1].yearMonth.month).toEqual(1);

      expect(timelineManager.months[2].yearMonth.year).toEqual(2023);
      expect(timelineManager.months[2].yearMonth.month).toEqual(1);
    });

    test('updates existing asset', () => {
      const updateAssetsSpy = vi.spyOn(timelineManager, 'upsertAssets');
      const asset = deriveLocalDateTimeFromFileCreatedAt(factory.timelineAsset());
      timelineManager.upsertAssets([asset]);

      expect(updateAssetsSpy).toHaveBeenCalledWith([asset]);
      expect(timelineManager.assetCount).toEqual(1);
    });

    test('ignores new assets that do not match the tag filter', async () => {
      await timelineManager.updateOptions({ tagId: 'tag-1' });

      const matching = deriveLocalDateTimeFromFileCreatedAt(factory.timelineAsset({ tags: ['tag-1'] }));
      const unrelated = deriveLocalDateTimeFromFileCreatedAt(factory.timelineAsset({ tags: ['tag-2'] }));

      timelineManager.upsertAssets([matching, unrelated]);

      expect(await getAssets(timelineManager)).toEqual([matching]);
    });

    // disabled due to the wasm Justified Layout import
    test('ignores trashed assets when isTrashed is true', async () => {
      const asset = deriveLocalDateTimeFromFileCreatedAt(factory.timelineAsset({ isTrashed: false }));
      const trashedAsset = deriveLocalDateTimeFromFileCreatedAt(factory.timelineAsset({ isTrashed: true }));

      const timelineManager = new TimelineManager();
      await timelineManager.updateOptions({ isTrashed: true });
      timelineManager.upsertAssets([asset, trashedAsset]);
      expect(await getAssets(timelineManager)).toEqual([trashedAsset]);
    });
  });

  describe('upsertAssets - updating existing', () => {
    let timelineManager: TimelineManager;

    beforeEach<Context>(async ({ api }) => {
      timelineManager = new TimelineManager();
      api.on({ getTimeBuckets: () => ({ json: [] }) });

      await timelineManager.updateViewport({ width: 1588, height: 1000 });
    });

    test('updates an asset', () => {
      const asset = deriveLocalDateTimeFromFileCreatedAt(factory.timelineAsset({ isFavorite: false }));
      const updatedAsset = { ...asset, isFavorite: true };

      timelineManager.upsertAssets([asset]);
      expect(timelineManager.assetCount).toEqual(1);
      expect(timelineManager.months[0].getFirstAsset().isFavorite).toEqual(false);

      timelineManager.upsertAssets([updatedAsset]);
      expect(timelineManager.assetCount).toEqual(1);
      expect(timelineManager.months[0].getFirstAsset().isFavorite).toEqual(true);
    });

    test('asset moves months when asset date changes', () => {
      const asset = deriveLocalDateTimeFromFileCreatedAt(
        factory.timelineAsset({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
        }),
      );
      const updatedAsset = deriveLocalDateTimeFromFileCreatedAt({
        ...asset,
        fileCreatedAt: fromISODateTimeUTCToObject('2024-03-20T12:00:00.000Z'),
      });

      timelineManager.upsertAssets([asset]);
      expect(timelineManager.months.length).toEqual(1);
      expect(getTimelineMonthByDate(timelineManager, { year: 2024, month: 1 })).not.toBeUndefined();
      expect(getTimelineMonthByDate(timelineManager, { year: 2024, month: 1 })?.getAssets().length).toEqual(1);

      timelineManager.upsertAssets([updatedAsset]);
      expect(timelineManager.months.length).toEqual(2);
      expect(getTimelineMonthByDate(timelineManager, { year: 2024, month: 1 })).not.toBeUndefined();
      expect(getTimelineMonthByDate(timelineManager, { year: 2024, month: 1 })?.getAssets().length).toEqual(0);
      expect(getTimelineMonthByDate(timelineManager, { year: 2024, month: 3 })).not.toBeUndefined();
      expect(getTimelineMonthByDate(timelineManager, { year: 2024, month: 3 })?.getAssets().length).toEqual(1);
    });

    test('asset is removed during upsert when TimelineManager if visibility changes', async () => {
      await timelineManager.updateOptions({
        visibility: AssetVisibility.Archive,
      });
      const fixture = deriveLocalDateTimeFromFileCreatedAt(
        factory.timelineAsset({
          visibility: AssetVisibility.Archive,
        }),
      );

      timelineManager.upsertAssets([fixture]);
      expect(timelineManager.assetCount).toEqual(1);

      const updated = Object.freeze({ ...fixture, visibility: AssetVisibility.Timeline });
      timelineManager.upsertAssets([updated]);
      expect(timelineManager.assetCount).toEqual(0);

      timelineManager.upsertAssets([{ ...fixture, visibility: AssetVisibility.Archive }]);
      expect(timelineManager.assetCount).toEqual(1);
    });

    test('asset is removed during upsert when TimelineManager if isFavorite changes', async () => {
      await timelineManager.updateOptions({
        isFavorite: true,
      });
      const fixture = deriveLocalDateTimeFromFileCreatedAt(
        factory.timelineAsset({
          isFavorite: true,
        }),
      );

      timelineManager.upsertAssets([fixture]);
      expect(timelineManager.assetCount).toEqual(1);

      const updated = Object.freeze({ ...fixture, isFavorite: false });
      timelineManager.upsertAssets([updated]);
      expect(timelineManager.assetCount).toEqual(0);

      timelineManager.upsertAssets([{ ...fixture, isFavorite: true }]);
      expect(timelineManager.assetCount).toEqual(1);
    });

    test('asset is removed during upsert when TimelineManager if isTrashed changes', async () => {
      await timelineManager.updateOptions({
        isTrashed: true,
      });
      const fixture = deriveLocalDateTimeFromFileCreatedAt(
        factory.timelineAsset({
          isTrashed: true,
        }),
      );

      timelineManager.upsertAssets([fixture]);
      expect(timelineManager.assetCount).toEqual(1);

      const updated = Object.freeze({ ...fixture, isTrashed: false });
      timelineManager.upsertAssets([updated]);
      expect(timelineManager.assetCount).toEqual(0);

      timelineManager.upsertAssets([{ ...fixture, isTrashed: true }]);
      expect(timelineManager.assetCount).toEqual(1);
    });
  });

  describe('AssetUpdate events', () => {
    let timelineManager: TimelineManager;

    beforeEach<Context>(async ({ api }) => {
      timelineManager = new TimelineManager();
      api.on({ getTimeBuckets: () => ({ json: [] }) });

      await timelineManager.updateViewport({ width: 1588, height: 1000 });
      await timelineManager.updateOptions({ albumId: 'album-id' });
    });

    afterEach(() => {
      timelineManager.destroy();
    });

    test('ignores unknown assets for album timelines', () => {
      eventManager.emit('AssetUpdate', factory.asset());

      expect(timelineManager.assetCount).toEqual(0);
      expect(timelineManager.months).toHaveLength(0);
    });

    test('updates existing assets in the timeline', () => {
      const existing = deriveLocalDateTimeFromFileCreatedAt(factory.timelineAsset({ isFavorite: false }));

      timelineManager.upsertAssets([existing]);
      eventManager.emit(
        'AssetUpdate',
        factory.asset({
          id: existing.id,
          ownerId: existing.ownerId,
          isFavorite: true,
          isTrashed: existing.isTrashed,
          visibility: existing.visibility,
        }),
      );

      expect(timelineManager.assetCount).toEqual(1);
      expect(timelineManager.months[0].getFirstAsset().isFavorite).toEqual(true);
    });
  });

  describe('live event asset insertion', () => {
    let timelineManager: TimelineManager;

    beforeEach<Context>(async ({ api }) => {
      timelineManager = new TimelineManager();
      api.on({ getTimeBuckets: () => ({ json: [] }) });

      await timelineManager.updateViewport({ width: 1588, height: 1000 });
    });

    afterEach(() => {
      timelineManager.destroy();
    });

    test('does not insert live event assets with a different owner into a user-scoped timeline', async () => {
      await timelineManager.updateOptions({ userId: 'partner-id', visibility: AssetVisibility.Timeline });

      const asset = deriveLocalDateTimeFromFileCreatedAt(
        factory.timelineAsset({
          ownerId: 'current-user-id',
          visibility: AssetVisibility.Timeline,
        }),
      );

      timelineManager.upsertAssetsFromLiveEvent([asset]);

      expect(timelineManager.assetCount).toEqual(0);
    });

    test('inserts live event assets for the matching owner into a user-scoped timeline', async () => {
      await timelineManager.updateOptions({ userId: 'partner-id', visibility: AssetVisibility.Timeline });

      const asset = deriveLocalDateTimeFromFileCreatedAt(
        factory.timelineAsset({
          ownerId: 'partner-id',
          visibility: AssetVisibility.Timeline,
        }),
      );

      timelineManager.upsertAssetsFromLiveEvent([asset]);

      expect(timelineManager.assetCount).toEqual(1);
    });

    test('does not insert unknown live event assets into album timelines', async () => {
      await timelineManager.updateOptions({ albumId: 'album-id' });

      const asset = deriveLocalDateTimeFromFileCreatedAt(factory.timelineAsset());

      timelineManager.upsertAssetsFromLiveEvent([asset]);

      expect(timelineManager.assetCount).toEqual(0);
    });

    test('updates existing live event assets in scoped timelines', async () => {
      await timelineManager.updateOptions({ albumId: 'album-id' });

      const asset = deriveLocalDateTimeFromFileCreatedAt(
        factory.timelineAsset({
          isFavorite: false,
        }),
      );

      timelineManager.upsertAssets([asset]);
      expect(timelineManager.assetCount).toEqual(1);
      expect(timelineManager.months[0].getFirstAsset().isFavorite).toEqual(false);

      timelineManager.upsertAssetsFromLiveEvent([
        {
          ...asset,
          isFavorite: true,
        },
      ]);

      expect(timelineManager.assetCount).toEqual(1);
      expect(timelineManager.months[0].getFirstAsset().isFavorite).toEqual(true);
    });
  });

  describe('removeAssets', () => {
    let timelineManager: TimelineManager;

    beforeEach<Context>(async ({ api }) => {
      timelineManager = new TimelineManager();
      api.on({ getTimeBuckets: () => ({ json: [] }) });

      await timelineManager.updateViewport({ width: 1588, height: 1000 });
    });

    test('ignores invalid IDs', () => {
      timelineManager.upsertAssets(
        factory
          .many(2, () =>
            factory.timelineAsset({
              fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
            }),
          )
          .map((asset) => deriveLocalDateTimeFromFileCreatedAt(asset)),
      );
      timelineManager.removeAssets(['', 'invalid', '4c7d9acc']);

      expect(timelineManager.assetCount).toEqual(2);
      expect(timelineManager.months.length).toEqual(1);
      expect(timelineManager.months[0].getAssets().length).toEqual(2);
    });

    test('removes asset from month', () => {
      const [assetOne, assetTwo] = factory
        .many(2, () =>
          factory.timelineAsset({
            fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
          }),
        )
        .map((asset) => deriveLocalDateTimeFromFileCreatedAt(asset));
      timelineManager.upsertAssets([assetOne, assetTwo]);
      timelineManager.removeAssets([assetOne.id]);

      expect(timelineManager.assetCount).toEqual(1);
      expect(timelineManager.months.length).toEqual(1);
      expect(timelineManager.months[0].getAssets().length).toEqual(1);
    });

    test('does not remove month when empty', () => {
      const assets = factory
        .many(2, () =>
          factory.timelineAsset({
            fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
          }),
        )
        .map((asset) => deriveLocalDateTimeFromFileCreatedAt(asset));
      timelineManager.upsertAssets(assets);
      timelineManager.removeAssets(assets.map((asset) => asset.id));

      expect(timelineManager.assetCount).toEqual(0);
      expect(timelineManager.months.length).toEqual(1);
    });
  });

  describe('firstAsset', () => {
    let timelineManager: TimelineManager;

    beforeEach<Context>(async ({ api }) => {
      timelineManager = new TimelineManager();
      api.on({ getTimeBuckets: () => ({ json: [] }) });
      await timelineManager.updateViewport({ width: 0, height: 0 });
    });

    test('empty store returns null', () => {
      expect(timelineManager.getFirstAsset()).toBeUndefined();
    });

    test('populated store returns first asset', () => {
      const assetOne = deriveLocalDateTimeFromFileCreatedAt(
        factory.timelineAsset({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
        }),
      );
      const assetTwo = deriveLocalDateTimeFromFileCreatedAt(
        factory.timelineAsset({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-15T12:00:00.000Z'),
        }),
      );
      timelineManager.upsertAssets([assetOne, assetTwo]);
      expect(timelineManager.getFirstAsset()).toEqual(assetOne);
    });
  });

  describe('getLaterAsset', () => {
    let timelineManager: TimelineManager;
    const bucketAssets: Record<string, TimelineAsset[]> = {
      '2024-03-01T00:00:00.000Z': factory
        .many(1, () => factory.timelineAsset())
        .map((asset) =>
          deriveLocalDateTimeFromFileCreatedAt({
            ...asset,
            fileCreatedAt: fromISODateTimeUTCToObject('2024-03-01T00:00:00.000Z'),
          }),
        ),
      '2024-02-01T00:00:00.000Z': factory
        .many(6, () => factory.timelineAsset())
        .map((asset) =>
          deriveLocalDateTimeFromFileCreatedAt({
            ...asset,
            fileCreatedAt: fromISODateTimeUTCToObject('2024-02-01T00:00:00.000Z'),
          }),
        ),
      '2024-01-01T00:00:00.000Z': factory
        .many(3, () => factory.timelineAsset())
        .map((asset) =>
          deriveLocalDateTimeFromFileCreatedAt({
            ...asset,
            fileCreatedAt: fromISODateTimeUTCToObject('2024-01-01T00:00:00.000Z'),
          }),
        ),
    };
    const bucketAssetsResponse: Record<string, TimeBucketAssetResponseDto> = Object.fromEntries(
      Object.entries(bucketAssets).map(([key, assets]) => [key, toResponseDto(...assets)]),
    );

    beforeEach<Context>(async ({ api }) => {
      timelineManager = new TimelineManager();
      mockTimeBuckets(
        api,
        [
          { count: 1, timeBucket: '2024-03-01T00:00:00.000Z' },
          { count: 6, timeBucket: '2024-02-01T00:00:00.000Z' },
          { count: 3, timeBucket: '2024-01-01T00:00:00.000Z' },
        ],
        bucketAssetsResponse,
      ).on({ getAssetInfo: () => ({ status: 404 }) });
      await timelineManager.updateViewport({ width: 1588, height: 1000 });
    });

    test('returns null for invalid assetId', async () => {
      expect(() => timelineManager.getLaterAsset({ id: 'invalid' } as AssetResponseDto)).not.toThrow();
      expect(await timelineManager.getLaterAsset({ id: 'invalid' } as AssetResponseDto)).toBeUndefined();
    });

    test('returns previous assetId', async () => {
      await timelineManager.loadTimelineMonth({ year: 2024, month: 1 });
      const month = getTimelineMonthByDate(timelineManager, { year: 2024, month: 1 });

      const a = month!.getAssets()[0];
      const b = month!.getAssets()[1];
      const previous = await timelineManager.getLaterAsset(b);
      expect(previous).toEqual(a);
    });

    test('returns previous assetId spanning multiple months', async () => {
      await timelineManager.loadTimelineMonth({ year: 2024, month: 2 });
      await timelineManager.loadTimelineMonth({ year: 2024, month: 3 });

      const month = getTimelineMonthByDate(timelineManager, { year: 2024, month: 2 });
      const previousMonth = getTimelineMonthByDate(timelineManager, { year: 2024, month: 3 });
      const a = month!.getAssets()[0];
      const b = previousMonth!.getAssets()[0];
      const previous = await timelineManager.getLaterAsset(a);
      expect(previous).toEqual(b);
    });

    test('loads previous month', async () => {
      await timelineManager.loadTimelineMonth({ year: 2024, month: 2 });
      const month = getTimelineMonthByDate(timelineManager, { year: 2024, month: 2 });
      const previousMonth = getTimelineMonthByDate(timelineManager, { year: 2024, month: 3 });
      const a = month!.getFirstAsset();
      const b = previousMonth!.getFirstAsset();
      const loadTimelineMonthSpy = vi.spyOn(month!.loader!, 'execute');
      const previousMonthSpy = vi.spyOn(previousMonth!.loader!, 'execute');
      const previous = await timelineManager.getLaterAsset(a);
      expect(previous).toEqual(b);
      expect(loadTimelineMonthSpy).not.toHaveBeenCalled();
      expect(previousMonthSpy).not.toHaveBeenCalled();
    });

    test('skips removed assets', async () => {
      await timelineManager.loadTimelineMonth({ year: 2024, month: 1 });
      await timelineManager.loadTimelineMonth({ year: 2024, month: 2 });
      await timelineManager.loadTimelineMonth({ year: 2024, month: 3 });

      const [assetOne, assetTwo, assetThree] = await getAssets(timelineManager);
      timelineManager.removeAssets([assetTwo.id]);
      expect(await timelineManager.getLaterAsset(assetThree)).toEqual(assetOne);
    });

    test('returns null when no more assets', async () => {
      await timelineManager.loadTimelineMonth({ year: 2024, month: 3 });
      expect(await timelineManager.getLaterAsset(timelineManager.months[0].getFirstAsset())).toBeUndefined();
    });
  });

  describe('getTimelineMonthIndexByAssetId', () => {
    let timelineManager: TimelineManager;

    beforeEach<Context>(async ({ api }) => {
      timelineManager = new TimelineManager();
      api.on({ getTimeBuckets: () => ({ json: [] }) });

      await timelineManager.updateViewport({ width: 0, height: 0 });
    });

    test('returns null for invalid months', () => {
      expect(getTimelineMonthByDate(timelineManager, { year: -1, month: -1 })).toBeUndefined();
      expect(getTimelineMonthByDate(timelineManager, { year: 2024, month: 3 })).toBeUndefined();
    });

    test('returns the month index', () => {
      const assetOne = deriveLocalDateTimeFromFileCreatedAt(
        factory.timelineAsset({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
        }),
      );
      const assetTwo = deriveLocalDateTimeFromFileCreatedAt(
        factory.timelineAsset({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-02-15T12:00:00.000Z'),
        }),
      );
      timelineManager.upsertAssets([assetOne, assetTwo]);

      expect(timelineManager.getTimelineMonthByAssetId(assetTwo.id)?.yearMonth.year).toEqual(2024);
      expect(timelineManager.getTimelineMonthByAssetId(assetTwo.id)?.yearMonth.month).toEqual(2);
      expect(timelineManager.getTimelineMonthByAssetId(assetOne.id)?.yearMonth.year).toEqual(2024);
      expect(timelineManager.getTimelineMonthByAssetId(assetOne.id)?.yearMonth.month).toEqual(1);
    });

    test('ignores removed months', () => {
      const assetOne = deriveLocalDateTimeFromFileCreatedAt(
        factory.timelineAsset({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
        }),
      );
      const assetTwo = deriveLocalDateTimeFromFileCreatedAt(
        factory.timelineAsset({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-02-15T12:00:00.000Z'),
        }),
      );
      timelineManager.upsertAssets([assetOne, assetTwo]);

      timelineManager.removeAssets([assetTwo.id]);
      expect(timelineManager.getTimelineMonthByAssetId(assetOne.id)?.yearMonth.year).toEqual(2024);
      expect(timelineManager.getTimelineMonthByAssetId(assetOne.id)?.yearMonth.month).toEqual(1);
    });
  });

  describe('getRandomAsset', () => {
    let timelineManager: TimelineManager;
    const bucketAssets: Record<string, TimelineAsset[]> = {
      '2024-03-01T00:00:00.000Z': factory
        .many(1, () => factory.timelineAsset())
        .map((asset) =>
          deriveLocalDateTimeFromFileCreatedAt({
            ...asset,
            fileCreatedAt: fromISODateTimeUTCToObject('2024-03-01T00:00:00.000Z'),
          }),
        ),
      '2024-02-01T00:00:00.000Z': factory
        .many(10, () => factory.timelineAsset())
        .map((asset, idx) =>
          deriveLocalDateTimeFromFileCreatedAt({
            ...asset,
            // here we make sure that not all assets are on the first day of the month
            fileCreatedAt: fromISODateTimeUTCToObject(`2024-02-0${idx < 7 ? 1 : 2}T00:00:00.000Z`),
          }),
        ),
      '2024-01-01T00:00:00.000Z': factory
        .many(3, () => factory.timelineAsset())
        .map((asset) =>
          deriveLocalDateTimeFromFileCreatedAt({
            ...asset,
            fileCreatedAt: fromISODateTimeUTCToObject('2024-01-01T00:00:00.000Z'),
          }),
        ),
    };

    const bucketAssetsResponse: Record<string, TimeBucketAssetResponseDto> = Object.fromEntries(
      Object.entries(bucketAssets).map(([key, assets]) => [key, toResponseDto(...assets)]),
    );

    beforeEach<Context>(async ({ api }) => {
      timelineManager = new TimelineManager();
      mockTimeBuckets(
        api,
        [
          { count: 1, timeBucket: '2024-03-01' },
          { count: 10, timeBucket: '2024-02-01' },
          { count: 3, timeBucket: '2024-01-01' },
        ],
        bucketAssetsResponse,
      );
      await timelineManager.updateViewport({ width: 1588, height: 0 });
    });

    test('gets all assets once', async () => {
      const assetCount = timelineManager.assetCount;
      expect(assetCount).toBe(14);
      const discoveredAssets: Set<string> = new Set();
      for (let idx = 0; idx < assetCount; idx++) {
        const asset = await timelineManager.getRandomAsset(idx);
        expect(asset).toBeDefined();
        const id = asset!.id;
        expect(discoveredAssets.has(id)).toBeFalsy();
        discoveredAssets.add(id);
      }

      expect(discoveredAssets.size).toBe(assetCount);
    });
  });

  describe('showAssetOwners', () => {
    const LS_KEY = 'album-show-asset-owners';

    beforeEach(() => {
      // ensure clean state
      globalThis.localStorage?.removeItem(LS_KEY);
    });

    test('persists across instances via localStorage', () => {
      const a = new TimelineManager();
      a.setShowAssetOwners(true);
      const b = new TimelineManager();
      expect(b.showAssetOwners).toBe(true);
    });
  });

  describe('retrieveRange', () => {
    test('uses createdAt ordering in the Recently Added view (orderBy=CreatedAt)', async ({ api }) => {
      // Simulate the "Recently Added" bug: two assets whose localDateTime order is
      // the reverse of their createdAt (upload) order. Before the fix, retrieveRange
      // compared localDateTime and selected the wrong range direction.
      const timelineManager = new TimelineManager();
      api.on({ getTimeBuckets: () => ({ json: [] }) });
      await timelineManager.updateOptions({ orderBy: AssetOrderBy.CreatedAt });

      // assetA was taken recently (2024) but uploaded first (2025-01)
      const assetA = factory.timelineAsset({
        localDateTime: fromISODateTimeUTCToObject('2024-06-01T00:00:00.000Z'),
        createdAt: fromISODateTimeUTCToObject('2025-01-20T00:00:00.000Z'),
        fileCreatedAt: fromISODateTimeUTCToObject('2025-01-20T00:00:00.000Z'),
      });
      // assetB was taken long ago (2018) but uploaded second (2025-02)
      const assetB = factory.timelineAsset({
        localDateTime: fromISODateTimeUTCToObject('2018-03-15T00:00:00.000Z'),
        createdAt: fromISODateTimeUTCToObject('2025-02-10T00:00:00.000Z'),
        fileCreatedAt: fromISODateTimeUTCToObject('2025-02-10T00:00:00.000Z'),
      });
      // assetC is an unrelated asset that should not appear in the selection
      const assetC = factory.timelineAsset({
        localDateTime: fromISODateTimeUTCToObject('2022-01-01T00:00:00.000Z'),
        createdAt: fromISODateTimeUTCToObject('2025-03-01T00:00:00.000Z'),
        fileCreatedAt: fromISODateTimeUTCToObject('2025-03-01T00:00:00.000Z'),
      });

      timelineManager.upsertAssets([assetA, assetB, assetC]);

      // Shift-click from assetB (uploaded most recently) to assetA — the range
      // between them in the "Recently Added" timeline should contain only those two.
      const range = await timelineManager.retrieveRange({ id: assetB.id }, { id: assetA.id });
      const ids = range.map((a) => a.id);
      expect(ids).toContain(assetA.id);
      expect(ids).toContain(assetB.id);
      expect(ids).not.toContain(assetC.id);
    });
  });
});
