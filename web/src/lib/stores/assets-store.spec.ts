import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { AbortError } from '$lib/utils';
import { fromISODateTimeUTCToObject } from '$lib/utils/timeline-util';
import { type AssetResponseDto, type TimeBucketAssetResponseDto } from '@immich/sdk';
import { timelineAssetFactory, toResponseDto } from '@test-data/factories/asset-factory';

async function getAssets(store: TimelineManager) {
  const assets = [];
  for await (const asset of store.assetsIterator()) {
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

describe('AssetStore', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('init', () => {
    let assetStore: TimelineManager;
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
      assetStore = new TimelineManager();
      sdkMock.getTimeBuckets.mockResolvedValue([
        { count: 1, timeBucket: '2024-03-01' },
        { count: 100, timeBucket: '2024-02-01' },
        { count: 3, timeBucket: '2024-01-01' },
      ]);

      sdkMock.getTimeBucket.mockImplementation(({ timeBucket }) => Promise.resolve(bucketAssetsResponse[timeBucket]));
      await assetStore.updateViewport({ width: 1588, height: 1000 });
    });

    it('should load months in viewport', () => {
      expect(sdkMock.getTimeBuckets).toBeCalledTimes(1);
      expect(sdkMock.getTimeBucket).toHaveBeenCalledTimes(2);
    });

    it('calculates month height', () => {
      const plainMonths = assetStore.months.map((month) => ({
        year: month.yearMonth.year,
        month: month.yearMonth.month,
        bucketHeight: month.bucketHeight,
      }));

      expect(plainMonths).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ year: 2024, month: 3, bucketHeight: 185.5 }),
          expect.objectContaining({ year: 2024, month: 2, bucketHeight: 12_016 }),
          expect.objectContaining({ year: 2024, month: 1, bucketHeight: 286 }),
        ]),
      );
    });

    it('calculates timeline height', () => {
      expect(assetStore.timelineHeight).toBe(12_487.5);
    });
  });

  describe('loadMonthGroup', () => {
    let assetStore: TimelineManager;
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
      assetStore = new TimelineManager();
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
      await assetStore.updateViewport({ width: 1588, height: 0 });
    });

    it('loads a month', async () => {
      expect(assetStore.getMonthGroupByDate({ year: 2024, month: 1 })?.getAssets().length).toEqual(0);
      await assetStore.loadMonthGroup({ year: 2024, month: 1 });
      expect(sdkMock.getTimeBucket).toBeCalledTimes(1);
      expect(assetStore.getMonthGroupByDate({ year: 2024, month: 1 })?.getAssets().length).toEqual(3);
    });

    it('ignores invalid months', async () => {
      await assetStore.loadMonthGroup({ year: 2023, month: 1 });
      expect(sdkMock.getTimeBucket).toBeCalledTimes(0);
    });

    it('cancels month loading', async () => {
      const month = assetStore.getMonthGroupByDate({ year: 2024, month: 1 })!;
      void assetStore.loadMonthGroup({ year: 2024, month: 1 });
      const abortSpy = vi.spyOn(month!.loader!.cancelToken!, 'abort');
      month?.cancel();
      expect(abortSpy).toBeCalledTimes(1);
      await assetStore.loadMonthGroup({ year: 2024, month: 1 });
      expect(assetStore.getMonthGroupByDate({ year: 2024, month: 1 })?.getAssets().length).toEqual(3);
    });

    it('prevents loading months multiple times', async () => {
      await Promise.all([
        assetStore.loadMonthGroup({ year: 2024, month: 1 }),
        assetStore.loadMonthGroup({ year: 2024, month: 1 }),
      ]);
      expect(sdkMock.getTimeBucket).toBeCalledTimes(1);

      await assetStore.loadMonthGroup({ year: 2024, month: 1 });
      expect(sdkMock.getTimeBucket).toBeCalledTimes(1);
    });

    it('allows loading a canceled month', async () => {
      const month = assetStore.getMonthGroupByDate({ year: 2024, month: 1 })!;
      const loadPromise = assetStore.loadMonthGroup({ year: 2024, month: 1 });

      month.cancel();
      await loadPromise;
      expect(month?.getAssets().length).toEqual(0);

      await assetStore.loadMonthGroup({ year: 2024, month: 1 });
      expect(month!.getAssets().length).toEqual(3);
    });
  });

  describe('addAssets', () => {
    let assetStore: TimelineManager;

    beforeEach(async () => {
      assetStore = new TimelineManager();
      sdkMock.getTimeBuckets.mockResolvedValue([]);

      await assetStore.updateViewport({ width: 1588, height: 1000 });
    });

    it('is empty initially', () => {
      expect(assetStore.months.length).toEqual(0);
      expect(assetStore.count).toEqual(0);
    });

    it('adds assets to new month', () => {
      const asset = deriveLocalDateTimeFromFileCreatedAt(
        timelineAssetFactory.build({
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
        }),
      );
      assetStore.addAssets([asset]);

      expect(assetStore.months.length).toEqual(1);
      expect(assetStore.count).toEqual(1);
      expect(assetStore.months[0].getAssets().length).toEqual(1);
      expect(assetStore.months[0].yearMonth.year).toEqual(2024);
      expect(assetStore.months[0].yearMonth.month).toEqual(1);
      expect(assetStore.months[0].getFirstAsset().id).toEqual(asset.id);
    });

    it('adds assets to existing month', () => {
      const [assetOne, assetTwo] = timelineAssetFactory
        .buildList(2, {
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
        })
        .map((asset) => deriveLocalDateTimeFromFileCreatedAt(asset));
      assetStore.addAssets([assetOne]);
      assetStore.addAssets([assetTwo]);

      expect(assetStore.months.length).toEqual(1);
      expect(assetStore.count).toEqual(2);
      expect(assetStore.months[0].getAssets().length).toEqual(2);
      expect(assetStore.months[0].yearMonth.year).toEqual(2024);
      expect(assetStore.months[0].yearMonth.month).toEqual(1);
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
      assetStore.addAssets([assetOne, assetTwo, assetThree]);

      const month = assetStore.getMonthGroupByDate({ year: 2024, month: 1 });
      expect(month).not.toBeNull();
      expect(month?.getAssets().length).toEqual(3);
      expect(month?.getAssets()[0].id).toEqual(assetOne.id);
      expect(month?.getAssets()[1].id).toEqual(assetThree.id);
      expect(month?.getAssets()[2].id).toEqual(assetTwo.id);
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
      assetStore.addAssets([assetOne, assetTwo, assetThree]);

      expect(assetStore.months.length).toEqual(3);
      expect(assetStore.months[0].yearMonth.year).toEqual(2024);
      expect(assetStore.months[0].yearMonth.month).toEqual(4);

      expect(assetStore.months[1].yearMonth.year).toEqual(2024);
      expect(assetStore.months[1].yearMonth.month).toEqual(1);

      expect(assetStore.months[2].yearMonth.year).toEqual(2023);
      expect(assetStore.months[2].yearMonth.month).toEqual(1);
    });

    it('updates existing asset', () => {
      const updateAssetsSpy = vi.spyOn(assetStore, 'updateAssets');
      const asset = deriveLocalDateTimeFromFileCreatedAt(timelineAssetFactory.build());
      assetStore.addAssets([asset]);

      assetStore.addAssets([asset]);
      expect(updateAssetsSpy).toBeCalledWith([asset]);
      expect(assetStore.count).toEqual(1);
    });

    // disabled due to the wasm Justified Layout import
    it('ignores trashed assets when isTrashed is true', async () => {
      const asset = deriveLocalDateTimeFromFileCreatedAt(timelineAssetFactory.build({ isTrashed: false }));
      const trashedAsset = deriveLocalDateTimeFromFileCreatedAt(timelineAssetFactory.build({ isTrashed: true }));

      const assetStore = new TimelineManager();
      await assetStore.updateOptions({ isTrashed: true });
      assetStore.addAssets([asset, trashedAsset]);
      expect(await getAssets(assetStore)).toEqual([trashedAsset]);
    });
  });

  describe('updateAssets', () => {
    let assetStore: TimelineManager;

    beforeEach(async () => {
      assetStore = new TimelineManager();
      sdkMock.getTimeBuckets.mockResolvedValue([]);

      await assetStore.updateViewport({ width: 1588, height: 1000 });
    });

    it('ignores non-existing assets', () => {
      assetStore.updateAssets([deriveLocalDateTimeFromFileCreatedAt(timelineAssetFactory.build())]);

      expect(assetStore.months.length).toEqual(0);
      expect(assetStore.count).toEqual(0);
    });

    it('updates an asset', () => {
      const asset = deriveLocalDateTimeFromFileCreatedAt(timelineAssetFactory.build({ isFavorite: false }));
      const updatedAsset = { ...asset, isFavorite: true };

      assetStore.addAssets([asset]);
      expect(assetStore.count).toEqual(1);
      expect(assetStore.months[0].getFirstAsset().isFavorite).toEqual(false);

      assetStore.updateAssets([updatedAsset]);
      expect(assetStore.count).toEqual(1);
      expect(assetStore.months[0].getFirstAsset().isFavorite).toEqual(true);
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

      assetStore.addAssets([asset]);
      expect(assetStore.months.length).toEqual(1);
      expect(assetStore.getMonthGroupByDate({ year: 2024, month: 1 })).not.toBeUndefined();
      expect(assetStore.getMonthGroupByDate({ year: 2024, month: 1 })?.getAssets().length).toEqual(1);

      assetStore.updateAssets([updatedAsset]);
      expect(assetStore.months.length).toEqual(2);
      expect(assetStore.getMonthGroupByDate({ year: 2024, month: 1 })).not.toBeUndefined();
      expect(assetStore.getMonthGroupByDate({ year: 2024, month: 1 })?.getAssets().length).toEqual(0);
      expect(assetStore.getMonthGroupByDate({ year: 2024, month: 3 })).not.toBeUndefined();
      expect(assetStore.getMonthGroupByDate({ year: 2024, month: 3 })?.getAssets().length).toEqual(1);
    });
  });

  describe('removeAssets', () => {
    let assetStore: TimelineManager;

    beforeEach(async () => {
      assetStore = new TimelineManager();
      sdkMock.getTimeBuckets.mockResolvedValue([]);

      await assetStore.updateViewport({ width: 1588, height: 1000 });
    });

    it('ignores invalid IDs', () => {
      assetStore.addAssets(
        timelineAssetFactory
          .buildList(2, {
            fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
          })
          .map((asset) => deriveLocalDateTimeFromFileCreatedAt(asset)),
      );
      assetStore.removeAssets(['', 'invalid', '4c7d9acc']);

      expect(assetStore.count).toEqual(2);
      expect(assetStore.months.length).toEqual(1);
      expect(assetStore.months[0].getAssets().length).toEqual(2);
    });

    it('removes asset from month', () => {
      const [assetOne, assetTwo] = timelineAssetFactory
        .buildList(2, {
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
        })
        .map((asset) => deriveLocalDateTimeFromFileCreatedAt(asset));
      assetStore.addAssets([assetOne, assetTwo]);
      assetStore.removeAssets([assetOne.id]);

      expect(assetStore.count).toEqual(1);
      expect(assetStore.months.length).toEqual(1);
      expect(assetStore.months[0].getAssets().length).toEqual(1);
    });

    it('does not remove month when empty', () => {
      const assets = timelineAssetFactory
        .buildList(2, {
          fileCreatedAt: fromISODateTimeUTCToObject('2024-01-20T12:00:00.000Z'),
        })
        .map((asset) => deriveLocalDateTimeFromFileCreatedAt(asset));
      assetStore.addAssets(assets);
      assetStore.removeAssets(assets.map((asset) => asset.id));

      expect(assetStore.count).toEqual(0);
      expect(assetStore.months.length).toEqual(1);
    });
  });

  describe('firstAsset', () => {
    let assetStore: TimelineManager;

    beforeEach(async () => {
      assetStore = new TimelineManager();
      sdkMock.getTimeBuckets.mockResolvedValue([]);
      await assetStore.updateViewport({ width: 0, height: 0 });
    });

    it('empty store returns null', () => {
      expect(assetStore.getFirstAsset()).toBeUndefined();
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
      assetStore.addAssets([assetOne, assetTwo]);
      expect(assetStore.getFirstAsset()).toEqual(assetOne);
    });
  });

  describe('getLaterAsset', () => {
    let assetStore: TimelineManager;
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
      assetStore = new TimelineManager();
      sdkMock.getTimeBuckets.mockResolvedValue([
        { count: 1, timeBucket: '2024-03-01T00:00:00.000Z' },
        { count: 6, timeBucket: '2024-02-01T00:00:00.000Z' },
        { count: 3, timeBucket: '2024-01-01T00:00:00.000Z' },
      ]);
      sdkMock.getTimeBucket.mockImplementation(({ timeBucket }) => Promise.resolve(bucketAssetsResponse[timeBucket]));
      await assetStore.updateViewport({ width: 1588, height: 1000 });
    });

    it('returns null for invalid assetId', async () => {
      expect(() => assetStore.getLaterAsset({ id: 'invalid' } as AssetResponseDto)).not.toThrow();
      expect(await assetStore.getLaterAsset({ id: 'invalid' } as AssetResponseDto)).toBeUndefined();
    });

    it('returns previous assetId', async () => {
      await assetStore.loadMonthGroup({ year: 2024, month: 1 });
      const month = assetStore.getMonthGroupByDate({ year: 2024, month: 1 });

      const a = month!.getAssets()[0];
      const b = month!.getAssets()[1];
      const previous = await assetStore.getLaterAsset(b);
      expect(previous).toEqual(a);
    });

    it('returns previous assetId spanning multiple months', async () => {
      await assetStore.loadMonthGroup({ year: 2024, month: 2 });
      await assetStore.loadMonthGroup({ year: 2024, month: 3 });

      const month = assetStore.getMonthGroupByDate({ year: 2024, month: 2 });
      const previousMonth = assetStore.getMonthGroupByDate({ year: 2024, month: 3 });
      const a = month!.getAssets()[0];
      const b = previousMonth!.getAssets()[0];
      const previous = await assetStore.getLaterAsset(a);
      expect(previous).toEqual(b);
    });

    it('loads previous month', async () => {
      await assetStore.loadMonthGroup({ year: 2024, month: 2 });
      const month = assetStore.getMonthGroupByDate({ year: 2024, month: 2 });
      const previousMonth = assetStore.getMonthGroupByDate({ year: 2024, month: 3 });
      const a = month!.getFirstAsset();
      const b = previousMonth!.getFirstAsset();
      const loadMonthGroupSpy = vi.spyOn(month!.loader!, 'execute');
      const previousMonthSpy = vi.spyOn(previousMonth!.loader!, 'execute');
      const previous = await assetStore.getLaterAsset(a);
      expect(previous).toEqual(b);
      expect(loadMonthGroupSpy).toBeCalledTimes(0);
      expect(previousMonthSpy).toBeCalledTimes(0);
    });

    it('skips removed assets', async () => {
      await assetStore.loadMonthGroup({ year: 2024, month: 1 });
      await assetStore.loadMonthGroup({ year: 2024, month: 2 });
      await assetStore.loadMonthGroup({ year: 2024, month: 3 });

      const [assetOne, assetTwo, assetThree] = await getAssets(assetStore);
      assetStore.removeAssets([assetTwo.id]);
      expect(await assetStore.getLaterAsset(assetThree)).toEqual(assetOne);
    });

    it('returns null when no more assets', async () => {
      await assetStore.loadMonthGroup({ year: 2024, month: 3 });
      expect(await assetStore.getLaterAsset(assetStore.months[0].getFirstAsset())).toBeUndefined();
    });
  });

  describe('getMonthGroupIndexByAssetId', () => {
    let assetStore: TimelineManager;

    beforeEach(async () => {
      assetStore = new TimelineManager();
      sdkMock.getTimeBuckets.mockResolvedValue([]);

      await assetStore.updateViewport({ width: 0, height: 0 });
    });

    it('returns null for invalid months', () => {
      expect(assetStore.getMonthGroupByDate({ year: -1, month: -1 })).toBeUndefined();
      expect(assetStore.getMonthGroupByDate({ year: 2024, month: 3 })).toBeUndefined();
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
      assetStore.addAssets([assetOne, assetTwo]);

      expect(assetStore.getMonthGroupIndexByAssetId(assetTwo.id)?.yearMonth.year).toEqual(2024);
      expect(assetStore.getMonthGroupIndexByAssetId(assetTwo.id)?.yearMonth.month).toEqual(2);
      expect(assetStore.getMonthGroupIndexByAssetId(assetOne.id)?.yearMonth.year).toEqual(2024);
      expect(assetStore.getMonthGroupIndexByAssetId(assetOne.id)?.yearMonth.month).toEqual(1);
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
      assetStore.addAssets([assetOne, assetTwo]);

      assetStore.removeAssets([assetTwo.id]);
      expect(assetStore.getMonthGroupIndexByAssetId(assetOne.id)?.yearMonth.year).toEqual(2024);
      expect(assetStore.getMonthGroupIndexByAssetId(assetOne.id)?.yearMonth.month).toEqual(1);
    });
  });
});
