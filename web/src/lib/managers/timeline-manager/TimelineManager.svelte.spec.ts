import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { getMonthByDate } from '$lib/managers/timeline-manager/internal/search-support.svelte';
import { setTestHooks } from '$lib/managers/timeline-manager/internal/TestHooks.svelte';
import type { TimelineDay } from '$lib/managers/timeline-manager/TimelineDay.svelte';
import { TimelineManager } from '$lib/managers/timeline-manager/TimelineManager.svelte';
import type { TimelineMonth } from '$lib/managers/timeline-manager/TimelineMonth.svelte';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { AbortError } from '$lib/utils';
import { fromISODateTimeUTCToObject, getSegmentIdentifier } from '$lib/utils/timeline-util';
import { type AssetResponseDto, type TimeBucketAssetResponseDto } from '@immich/sdk';
import { timelineAssetFactory, toResponseDto } from '@test-data/factories/asset-factory';
import { tick } from 'svelte';
import type { MockInstance } from 'vitest';

async function getAssets(timelineManager: TimelineManager) {
  const assets = [];
  for await (const asset of timelineManager.assetsIterator()) {
    assets.push(asset);
  }
  return assets;
}

function deriveLocalDateTimeFromFileCreatedAt(arg: TimelineAsset): TimelineAsset {
  return {
    ...arg,
    localDateTime: arg.fileCreatedAt,
  };
}

describe('TimelineManager', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('init', () => {
    let timelineManager: TimelineManager;
    const bucketAssets: Record<string, TimelineAsset[]> = {
      '2024-03-01T00:00:00.000Z': timelineAssetFactory.buildList(1).map((asset) =>
        deriveLocalDateTimeFromFileCreatedAt({
          ...asset,
          fileCreatedAt: fromISODateTimeUTCToObject('2024-03-01T00:00:00.000Z'),
        }),
      ),
      '2024-02-01T00:00:00.000Z': timelineAssetFactory.buildList(100).map((asset) =>
        deriveLocalDateTimeFromFileCreatedAt({
          ...asset,
          fileCreatedAt: fromISODateTimeUTCToObject('2024-02-01T00:00:00.000Z'),
        }),
      ),
      '2024-01-01T00:00:00.000Z': timelineAssetFactory.buildList(3).map((asset) =>
        deriveLocalDateTimeFromFileCreatedAt({
          ...asset,
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-01T00:00:00.000Z'),
        }),
      ),
    };

    const bucketAssetsResponse: Record<string, TimeBucketAssetResponseDto> = Object.fromEntries(
      Object.entries(bucketAssets).map(([key, assets]) => [key, toResponseDto(...assets)]),
    );

    beforeEach(async () => {
      timelineManager = new TimelineManager();
      sdkMock.getTimeBuckets.mockResolvedValue([
        { count: 1, timeBucket: '2024-03-01' },
        { count: 100, timeBucket: '2024-02-01' },
        { count: 3, timeBucket: '2024-01-01' },
      ]);

      sdkMock.getTimeBucket.mockImplementation(({ timeBucket }) => Promise.resolve(bucketAssetsResponse[timeBucket]));
      await timelineManager.updateViewport({ width: 1588, height: 1000 });
      await tick();
    });

    it('should load months in viewport', () => {
      expect(sdkMock.getTimeBuckets).toBeCalledTimes(1);
      expect(sdkMock.getTimeBucket).toHaveBeenCalledTimes(2);
    });

    it('calculates month height', () => {
      const plainMonths = timelineManager.segments.map((month) => ({
        year: month.yearMonth.year,
        month: month.yearMonth.month,
        height: month.height,
      }));

      expect(plainMonths).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ year: 2024, month: 3, height: 283 }),
          expect.objectContaining({ year: 2024, month: 2, height: 7711 }),
          expect.objectContaining({ year: 2024, month: 1, height: 286 }),
        ]),
      );
    });

    it('calculates timeline height', () => {
      expect(timelineManager.totalViewerHeight).toBe(8340);
    });
  });

  describe('loadSegment', () => {
    let timelineManager: TimelineManager;
    const bucketAssets: Record<string, TimelineAsset[]> = {
      '2024-01-03T00:00:00.000Z': timelineAssetFactory.buildList(1).map((asset) =>
        deriveLocalDateTimeFromFileCreatedAt({
          ...asset,
          fileCreatedAt: fromISODateTimeUTCToObject('2024-03-01T00:00:00.000Z'),
        }),
      ),
      '2024-01-01T00:00:00.000Z': timelineAssetFactory.buildList(3).map((asset) =>
        deriveLocalDateTimeFromFileCreatedAt({
          ...asset,
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-01T00:00:00.000Z'),
        }),
      ),
    };
    const bucketAssetsResponse: Record<string, TimeBucketAssetResponseDto> = Object.fromEntries(
      Object.entries(bucketAssets).map(([key, assets]) => [key, toResponseDto(...assets)]),
    );
    beforeEach(async () => {
      timelineManager = new TimelineManager();
      sdkMock.getTimeBuckets.mockResolvedValue([
        { count: 1, timeBucket: '2024-03-01T00:00:00.000Z' },
        { count: 3, timeBucket: '2024-01-01T00:00:00.000Z' },
      ]);
      sdkMock.getTimeBucket.mockImplementation(async ({ timeBucket }, { signal } = {}) => {
        await new Promise((resolve) => setTimeout(resolve, 0));
        if (signal?.aborted) {
          throw new AbortError();
        }
        return bucketAssetsResponse[timeBucket];
      });
      await timelineManager.updateViewport({ width: 1588, height: 0 });
    });

    it('loads a month', async () => {
      expect(getMonthByDate(timelineManager, { year: 2024, month: 1 })?.assets.length).toEqual(0);
      await timelineManager.loadSegment(getSegmentIdentifier({ year: 2024, month: 1 }));
      expect(sdkMock.getTimeBucket).toBeCalledTimes(1);
      expect(getMonthByDate(timelineManager, { year: 2024, month: 1 })?.assets.length).toEqual(3);
    });

    it('ignores invalid months', async () => {
      await timelineManager.loadSegment(getSegmentIdentifier({ year: 2023, month: 1 }));
      expect(sdkMock.getTimeBucket).toBeCalledTimes(0);
    });

    it('cancels month loading', async () => {
      const month = getMonthByDate(timelineManager, { year: 2024, month: 1 })!;
      void timelineManager.loadSegment(getSegmentIdentifier({ year: 2024, month: 1 }));
      const abortSpy = vi.spyOn(month!.loader!.cancelToken!, 'abort');
      month?.cancel();
      expect(abortSpy).toBeCalledTimes(1);
      await timelineManager.loadSegment(getSegmentIdentifier({ year: 2024, month: 1 }));
      expect(getMonthByDate(timelineManager, { year: 2024, month: 1 })?.assets.length).toEqual(3);
    });

    it('prevents loading months multiple times', async () => {
      await Promise.all([
        timelineManager.loadSegment(getSegmentIdentifier({ year: 2024, month: 1 })),
        timelineManager.loadSegment(getSegmentIdentifier({ year: 2024, month: 1 })),
      ]);
      expect(sdkMock.getTimeBucket).toBeCalledTimes(1);

      await timelineManager.loadSegment(getSegmentIdentifier({ year: 2024, month: 1 }));
      expect(sdkMock.getTimeBucket).toBeCalledTimes(1);
    });

    it('allows loading a canceled month', async () => {
      const month = getMonthByDate(timelineManager, { year: 2024, month: 1 })!;
      const loadPromise = timelineManager.loadSegment(getSegmentIdentifier({ year: 2024, month: 1 }));

      month.cancel();
      await loadPromise;
      expect(month?.assets.length).toEqual(0);

      await timelineManager.loadSegment(getSegmentIdentifier({ year: 2024, month: 1 }));
      expect(month!.assets.length).toEqual(3);
    });
  });

  describe('upsertAssets', () => {
    let timelineManager: TimelineManager;

    beforeEach(async () => {
      timelineManager = new TimelineManager();
      sdkMock.getTimeBuckets.mockResolvedValue([]);

      await timelineManager.updateViewport({ width: 1588, height: 1000 });
    });

    it('is empty initially', () => {
      expect(timelineManager.segments.length).toEqual(0);
      expect(timelineManager.assetCount).toEqual(0);
    });

    it('adds assets to new month', () => {
      const asset = deriveLocalDateTimeFromFileCreatedAt(
        timelineAssetFactory.build({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
        }),
      );
      timelineManager.upsertAssets([asset]);

      expect(timelineManager.segments.length).toEqual(1);
      expect(timelineManager.assetCount).toEqual(1);
      expect(timelineManager.segments[0].assets.length).toEqual(1);
      expect(timelineManager.segments[0].yearMonth.year).toEqual(2024);
      expect(timelineManager.segments[0].yearMonth.month).toEqual(1);
      expect(timelineManager.segments[0].getFirstAsset().id).toEqual(asset.id);
    });

    it('adds assets to existing month', () => {
      const [assetOne, assetTwo] = timelineAssetFactory
        .buildList(2, {
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
        })
        .map((asset) => deriveLocalDateTimeFromFileCreatedAt(asset));
      timelineManager.upsertAssets([assetOne]);
      timelineManager.upsertAssets([assetTwo]);

      expect(timelineManager.segments.length).toEqual(1);
      expect(timelineManager.assetCount).toEqual(2);
      expect(timelineManager.segments[0].assets.length).toEqual(2);
      expect(timelineManager.segments[0].yearMonth.year).toEqual(2024);
      expect(timelineManager.segments[0].yearMonth.month).toEqual(1);
    });

    it('orders assets in months by descending date', () => {
      const assetOne = deriveLocalDateTimeFromFileCreatedAt(
        timelineAssetFactory.build({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
        }),
      );
      const assetTwo = deriveLocalDateTimeFromFileCreatedAt(
        timelineAssetFactory.build({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-15T12:00:00.000Z'),
        }),
      );
      const assetThree = deriveLocalDateTimeFromFileCreatedAt(
        timelineAssetFactory.build({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-16T12:00:00.000Z'),
        }),
      );
      timelineManager.upsertAssets([assetOne, assetTwo, assetThree]);

      const month = getMonthByDate(timelineManager, { year: 2024, month: 1 });
      expect(month).not.toBeNull();
      expect(month?.assets.length).toEqual(3);
      expect(month?.assets[0].id).toEqual(assetOne.id);
      expect(month?.assets[1].id).toEqual(assetThree.id);
      expect(month?.assets[2].id).toEqual(assetTwo.id);
    });

    it('orders months by descending date', () => {
      const assetOne = deriveLocalDateTimeFromFileCreatedAt(
        timelineAssetFactory.build({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
        }),
      );
      const assetTwo = deriveLocalDateTimeFromFileCreatedAt(
        timelineAssetFactory.build({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-04-20T12:00:00.000Z'),
        }),
      );
      const assetThree = deriveLocalDateTimeFromFileCreatedAt(
        timelineAssetFactory.build({
          fileCreatedAt: fromISODateTimeUTCToObject('2023-01-20T12:00:00.000Z'),
        }),
      );
      timelineManager.upsertAssets([assetOne, assetTwo, assetThree]);

      expect(timelineManager.segments.length).toEqual(3);
      expect(timelineManager.segments[0].yearMonth.year).toEqual(2024);
      expect(timelineManager.segments[0].yearMonth.month).toEqual(4);

      expect(timelineManager.segments[1].yearMonth.year).toEqual(2024);
      expect(timelineManager.segments[1].yearMonth.month).toEqual(1);

      expect(timelineManager.segments[2].yearMonth.year).toEqual(2023);
      expect(timelineManager.segments[2].yearMonth.month).toEqual(1);
    });

    it('updates existing asset', () => {
      const updateAssetsSpy = vi.spyOn(timelineManager, 'upsertAssets');
      const asset = deriveLocalDateTimeFromFileCreatedAt(timelineAssetFactory.build());
      timelineManager.upsertAssets([asset]);

      timelineManager.upsertAssets([asset]);
      expect(updateAssetsSpy).toBeCalledWith([asset]);
      expect(timelineManager.assetCount).toEqual(1);
    });

    // disabled due to the wasm Justified Layout import
    it('ignores trashed assets when isTrashed is true', async () => {
      const asset = deriveLocalDateTimeFromFileCreatedAt(timelineAssetFactory.build({ isTrashed: false }));
      const trashedAsset = deriveLocalDateTimeFromFileCreatedAt(timelineAssetFactory.build({ isTrashed: true }));

      const timelineManager = new TimelineManager();
      await timelineManager.updateOptions({ isTrashed: true });
      timelineManager.upsertAssets([asset, trashedAsset]);
      expect(await getAssets(timelineManager)).toEqual([trashedAsset]);
    });
  });

  describe('ensure efficient timeline operations', () => {
    let timelineManager: TimelineManager;

    let month1day1asset1: TimelineAsset,
      month1day2asset1: TimelineAsset,
      month1day2asset2: TimelineAsset,
      month1day3asset1: TimelineAsset,
      month2day1asset1: TimelineAsset,
      month2day2asset1: TimelineAsset,
      month2day2asset2: TimelineAsset;

    type DayMocks = {
      layoutFn: MockInstance;
      sortAssetsFn: MockInstance;
    };
    type MonthMocks = {
      sortDaysFn: MockInstance;
    };

    const dayGroups = new Map<TimelineDay, DayMocks>();
    const months = new Map<TimelineMonth, MonthMocks>();

    beforeEach(async () => {
      timelineManager = new TimelineManager();
      setTestHooks({
        onCreateTimelineDay: (day: TimelineDay) => {
          dayGroups.set(day, {
            layoutFn: vi.spyOn(day, 'layout'),
            sortAssetsFn: vi.spyOn(day, 'sortAssets'),
          });
        },
        onCreateTimelineMonth: (month: TimelineMonth) => {
          months.set(month, {
            sortDaysFn: vi.spyOn(month, 'sortDays'),
          });
        },
      });
      sdkMock.getTimeBuckets.mockResolvedValue([]);
      month1day1asset1 = deriveLocalDateTimeFromFileCreatedAt(
        timelineAssetFactory.build({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
        }),
      );
      month1day2asset1 = deriveLocalDateTimeFromFileCreatedAt(
        timelineAssetFactory.build({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-15T12:00:00.000Z'),
        }),
      );
      month1day2asset2 = deriveLocalDateTimeFromFileCreatedAt(
        timelineAssetFactory.build({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-15T13:00:00.000Z'),
        }),
      );
      month1day3asset1 = deriveLocalDateTimeFromFileCreatedAt(
        timelineAssetFactory.build({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-16T12:00:00.000Z'),
        }),
      );
      month2day1asset1 = deriveLocalDateTimeFromFileCreatedAt(
        timelineAssetFactory.build({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-02-16T12:00:00.000Z'),
        }),
      );
      month2day2asset1 = deriveLocalDateTimeFromFileCreatedAt(
        timelineAssetFactory.build({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-02-18T12:00:00.000Z'),
        }),
      );
      month2day2asset2 = deriveLocalDateTimeFromFileCreatedAt(
        timelineAssetFactory.build({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-02-18T13:00:00.000Z'),
        }),
      );

      await timelineManager.updateViewport({ width: 1588, height: 1000 });
      timelineManager.upsertAssets([
        month1day1asset1,
        month1day2asset1,
        month1day2asset2,
        month1day3asset1,
        month2day1asset1,
        month2day2asset1,
        month2day2asset2,
      ]);
      vitest.resetAllMocks();
    });
    it.skip('Not Ready Yet - optimizations not complete: moving asset between months only sorts/layout the affected months once', () => {
      // move from 2024-01-15 to 2024-01-16
      timelineManager.updateAssetOperation([month1day2asset1.id], (asset) => {
        asset.localDateTime.day = asset.localDateTime.day + 1;
      });
      for (const [day, mocks] of dayGroups) {
        if (day.day === 15 && day.month.yearMonth.month === 1) {
          // source - should be layout once
          expect.soft(mocks.layoutFn).toBeCalledTimes(1);
          expect.soft(mocks.sortAssetsFn).toBeCalledTimes(1);
        }
        if (day.day === 16 && day.month.yearMonth.month === 1) {
          // target - should be layout once
          expect.soft(mocks.layoutFn).toBeCalledTimes(1);
          expect.soft(mocks.sortAssetsFn).toBeCalledTimes(1);
        }
        // everything else - should not be layed-out
        expect.soft(mocks.layoutFn).toBeCalledTimes(0);
        expect.soft(mocks.sortAssetsFn).toBeCalledTimes(0);
      }
      for (const [_, mocks] of months) {
        // if the day itself did not change, probably no need to sort it
        // in the timeline manager, the day-group identity is immutable - you will never
        // "move" a whole day to another day - only the assets inside will be moved from
        // one to the other.
        expect.soft(mocks.sortDaysFn).toBeCalledTimes(0);
      }
    });
  });

  describe('upsertAssets', () => {
    let timelineManager: TimelineManager;

    beforeEach(async () => {
      timelineManager = new TimelineManager();
      sdkMock.getTimeBuckets.mockResolvedValue([]);

      await timelineManager.updateViewport({ width: 1588, height: 1000 });
    });

    it('upserts an asset', () => {
      const asset = deriveLocalDateTimeFromFileCreatedAt(timelineAssetFactory.build({ isFavorite: false }));
      const updatedAsset = { ...asset, isFavorite: true };

      timelineManager.upsertAssets([asset]);
      expect(timelineManager.assetCount).toEqual(1);
      expect(timelineManager.segments[0].getFirstAsset().isFavorite).toEqual(false);

      timelineManager.upsertAssets([updatedAsset]);
      expect(timelineManager.assetCount).toEqual(1);
      expect(timelineManager.segments[0].getFirstAsset().isFavorite).toEqual(true);
    });

    it('asset moves months when asset date changes', () => {
      const asset = deriveLocalDateTimeFromFileCreatedAt(
        timelineAssetFactory.build({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
        }),
      );
      const updatedAsset = deriveLocalDateTimeFromFileCreatedAt({
        ...asset,
        fileCreatedAt: fromISODateTimeUTCToObject('2024-03-20T12:00:00.000Z'),
      });

      timelineManager.upsertAssets([asset]);
      expect(timelineManager.segments.length).toEqual(1);
      expect(getMonthByDate(timelineManager, { year: 2024, month: 1 })).not.toBeUndefined();
      expect(getMonthByDate(timelineManager, { year: 2024, month: 1 })?.assets.length).toEqual(1);

      timelineManager.upsertAssets([updatedAsset]);
      expect(timelineManager.segments.length).toEqual(2);
      expect(getMonthByDate(timelineManager, { year: 2024, month: 1 })).not.toBeUndefined();
      expect(getMonthByDate(timelineManager, { year: 2024, month: 1 })?.assets.length).toEqual(0);
      expect(getMonthByDate(timelineManager, { year: 2024, month: 3 })).not.toBeUndefined();
      expect(getMonthByDate(timelineManager, { year: 2024, month: 3 })?.assets.length).toEqual(1);
    });
  });

  describe('removeAssets', () => {
    let timelineManager: TimelineManager;

    beforeEach(async () => {
      timelineManager = new TimelineManager();
      sdkMock.getTimeBuckets.mockResolvedValue([]);

      await timelineManager.updateViewport({ width: 1588, height: 1000 });
    });

    it('ignores invalid IDs', () => {
      timelineManager.upsertAssets(
        timelineAssetFactory
          .buildList(2, {
            fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
          })
          .map((asset) => deriveLocalDateTimeFromFileCreatedAt(asset)),
      );
      timelineManager.removeAssets(['', 'invalid', '4c7d9acc']);

      expect(timelineManager.assetCount).toEqual(2);
      expect(timelineManager.segments.length).toEqual(1);
      expect(timelineManager.segments[0].assets.length).toEqual(2);
    });

    it('removes asset from month', () => {
      const [assetOne, assetTwo] = timelineAssetFactory
        .buildList(2, {
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
        })
        .map((asset) => deriveLocalDateTimeFromFileCreatedAt(asset));
      timelineManager.upsertAssets([assetOne, assetTwo]);
      timelineManager.removeAssets([assetOne.id]);

      expect(timelineManager.assetCount).toEqual(1);
      expect(timelineManager.segments.length).toEqual(1);
      expect(timelineManager.segments[0].assets.length).toEqual(1);
    });

    it('does not remove month when empty', () => {
      const assets = timelineAssetFactory
        .buildList(2, {
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
        })
        .map((asset) => deriveLocalDateTimeFromFileCreatedAt(asset));
      timelineManager.upsertAssets(assets);
      timelineManager.removeAssets(assets.map((asset) => asset.id));

      expect(timelineManager.assetCount).toEqual(0);
      expect(timelineManager.segments.length).toEqual(1);
    });
  });

  describe('firstAsset', () => {
    let timelineManager: TimelineManager;

    beforeEach(async () => {
      timelineManager = new TimelineManager();
      sdkMock.getTimeBuckets.mockResolvedValue([]);
      await timelineManager.updateViewport({ width: 0, height: 0 });
    });

    it('empty store returns null', () => {
      expect(timelineManager.getFirstAsset()).toBeUndefined();
    });

    it('populated store returns first asset', () => {
      const assetOne = deriveLocalDateTimeFromFileCreatedAt(
        timelineAssetFactory.build({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
        }),
      );
      const assetTwo = deriveLocalDateTimeFromFileCreatedAt(
        timelineAssetFactory.build({
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
      '2024-03-01T00:00:00.000Z': timelineAssetFactory.buildList(1).map((asset) =>
        deriveLocalDateTimeFromFileCreatedAt({
          ...asset,
          fileCreatedAt: fromISODateTimeUTCToObject('2024-03-01T00:00:00.000Z'),
        }),
      ),
      '2024-02-01T00:00:00.000Z': timelineAssetFactory.buildList(6).map((asset) =>
        deriveLocalDateTimeFromFileCreatedAt({
          ...asset,
          fileCreatedAt: fromISODateTimeUTCToObject('2024-02-01T00:00:00.000Z'),
        }),
      ),
      '2024-01-01T00:00:00.000Z': timelineAssetFactory.buildList(3).map((asset) =>
        deriveLocalDateTimeFromFileCreatedAt({
          ...asset,
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-01T00:00:00.000Z'),
        }),
      ),
    };
    const bucketAssetsResponse: Record<string, TimeBucketAssetResponseDto> = Object.fromEntries(
      Object.entries(bucketAssets).map(([key, assets]) => [key, toResponseDto(...assets)]),
    );

    beforeEach(async () => {
      timelineManager = new TimelineManager();
      sdkMock.getTimeBuckets.mockResolvedValue([
        { count: 1, timeBucket: '2024-03-01T00:00:00.000Z' },
        { count: 6, timeBucket: '2024-02-01T00:00:00.000Z' },
        { count: 3, timeBucket: '2024-01-01T00:00:00.000Z' },
      ]);
      sdkMock.getTimeBucket.mockImplementation(({ timeBucket }) => Promise.resolve(bucketAssetsResponse[timeBucket]));
      await timelineManager.updateViewport({ width: 1588, height: 1000 });
    });

    it('returns null for invalid assetId', async () => {
      expect(() => timelineManager.getLaterAsset({ id: 'invalid' } as AssetResponseDto)).not.toThrow();
      expect(await timelineManager.getLaterAsset({ id: 'invalid' } as AssetResponseDto)).toBeUndefined();
    });

    it('returns previous assetId', async () => {
      await timelineManager.loadSegment(getSegmentIdentifier({ year: 2024, month: 1 }));
      const month = getMonthByDate(timelineManager, { year: 2024, month: 1 });

      const a = month!.assets[0];
      const b = month!.assets[1];
      const previous = await timelineManager.getLaterAsset(b);
      expect(previous).toEqual(a);
    });

    it('returns previous assetId spanning multiple months', async () => {
      await timelineManager.loadSegment(getSegmentIdentifier({ year: 2024, month: 2 }));
      await timelineManager.loadSegment(getSegmentIdentifier({ year: 2024, month: 3 }));

      const month = getMonthByDate(timelineManager, { year: 2024, month: 2 });
      const previousMonth = getMonthByDate(timelineManager, { year: 2024, month: 3 });
      const a = month!.assets[0];
      const b = previousMonth!.assets[0];
      const previous = await timelineManager.getLaterAsset(a);
      expect(previous).toEqual(b);
    });

    it('loads previous month', async () => {
      await timelineManager.loadSegment(getSegmentIdentifier({ year: 2024, month: 2 }));
      const month = getMonthByDate(timelineManager, { year: 2024, month: 2 });
      const previousMonth = getMonthByDate(timelineManager, { year: 2024, month: 3 });
      const a = month!.getFirstAsset();
      const b = previousMonth!.getFirstAsset();
      const loadmonthSpy = vi.spyOn(month!.loader!, 'execute');
      const previousMonthSpy = vi.spyOn(previousMonth!.loader!, 'execute');
      const previous = await timelineManager.getLaterAsset(a);
      expect(previous).toEqual(b);
      expect(loadmonthSpy).toBeCalledTimes(0);
      expect(previousMonthSpy).toBeCalledTimes(0);
    });

    it('skips removed assets', async () => {
      await timelineManager.loadSegment(getSegmentIdentifier({ year: 2024, month: 1 }));
      await timelineManager.loadSegment(getSegmentIdentifier({ year: 2024, month: 2 }));
      await timelineManager.loadSegment(getSegmentIdentifier({ year: 2024, month: 3 }));

      const [assetOne, assetTwo, assetThree] = await getAssets(timelineManager);
      timelineManager.removeAssets([assetTwo.id]);
      expect(await timelineManager.getLaterAsset(assetThree)).toEqual(assetOne);
    });

    it('returns null when no more assets', async () => {
      await timelineManager.loadSegment(getSegmentIdentifier({ year: 2024, month: 3 }));
      expect(await timelineManager.getLaterAsset(timelineManager.segments[0].getFirstAsset())).toBeUndefined();
    });
  });

  describe('getmonthIndexByAssetId', () => {
    let timelineManager: TimelineManager;

    beforeEach(async () => {
      timelineManager = new TimelineManager();
      sdkMock.getTimeBuckets.mockResolvedValue([]);

      await timelineManager.updateViewport({ width: 0, height: 0 });
    });

    it('returns null for invalid months', () => {
      expect(getMonthByDate(timelineManager, { year: -1, month: -1 })).toBeUndefined();
      expect(getMonthByDate(timelineManager, { year: 2024, month: 3 })).toBeUndefined();
    });

    it('returns the month index', () => {
      const assetOne = deriveLocalDateTimeFromFileCreatedAt(
        timelineAssetFactory.build({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
        }),
      );
      const assetTwo = deriveLocalDateTimeFromFileCreatedAt(
        timelineAssetFactory.build({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-02-15T12:00:00.000Z'),
        }),
      );
      timelineManager.upsertAssets([assetOne, assetTwo]);

      expect((timelineManager.getSegmentForAssetId(assetTwo.id) as TimelineMonth)?.yearMonth.year).toEqual(2024);
      expect((timelineManager.getSegmentForAssetId(assetTwo.id) as TimelineMonth)?.yearMonth.month).toEqual(2);
      expect((timelineManager.getSegmentForAssetId(assetOne.id) as TimelineMonth)?.yearMonth.year).toEqual(2024);
      expect((timelineManager.getSegmentForAssetId(assetOne.id) as TimelineMonth)?.yearMonth.month).toEqual(1);
    });

    it('ignores removed months', () => {
      const assetOne = deriveLocalDateTimeFromFileCreatedAt(
        timelineAssetFactory.build({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
        }),
      );
      const assetTwo = deriveLocalDateTimeFromFileCreatedAt(
        timelineAssetFactory.build({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-02-15T12:00:00.000Z'),
        }),
      );
      timelineManager.upsertAssets([assetOne, assetTwo]);

      timelineManager.removeAssets([assetTwo.id]);
      expect((timelineManager.getSegmentForAssetId(assetOne.id) as TimelineMonth)?.yearMonth.year).toEqual(2024);
      expect((timelineManager.getSegmentForAssetId(assetOne.id) as TimelineMonth)?.yearMonth.month).toEqual(1);
    });
  });

  describe('getRandomAsset', () => {
    let timelineManager: TimelineManager;
    const bucketAssets: Record<string, TimelineAsset[]> = {
      '2024-03-01T00:00:00.000Z': timelineAssetFactory.buildList(1).map((asset) =>
        deriveLocalDateTimeFromFileCreatedAt({
          ...asset,
          fileCreatedAt: fromISODateTimeUTCToObject('2024-03-01T00:00:00.000Z'),
        }),
      ),
      '2024-02-01T00:00:00.000Z': timelineAssetFactory.buildList(10).map((asset, idx) =>
        deriveLocalDateTimeFromFileCreatedAt({
          ...asset,
          // here we make sure that not all assets are on the first day of the month
          fileCreatedAt: fromISODateTimeUTCToObject(`2024-02-0${idx < 7 ? 1 : 2}T00:00:00.000Z`),
        }),
      ),
      '2024-01-01T00:00:00.000Z': timelineAssetFactory.buildList(3).map((asset) =>
        deriveLocalDateTimeFromFileCreatedAt({
          ...asset,
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-01T00:00:00.000Z'),
        }),
      ),
    };

    const bucketAssetsResponse: Record<string, TimeBucketAssetResponseDto> = Object.fromEntries(
      Object.entries(bucketAssets).map(([key, assets]) => [key, toResponseDto(...assets)]),
    );

    beforeEach(async () => {
      timelineManager = new TimelineManager();
      sdkMock.getTimeBuckets.mockResolvedValue([
        { count: 1, timeBucket: '2024-03-01' },
        { count: 10, timeBucket: '2024-02-01' },
        { count: 3, timeBucket: '2024-01-01' },
      ]);

      sdkMock.getTimeBucket.mockImplementation(({ timeBucket }) => Promise.resolve(bucketAssetsResponse[timeBucket]));
      await timelineManager.updateViewport({ width: 1588, height: 0 });
    });

    it('gets all assets once', async () => {
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
});
