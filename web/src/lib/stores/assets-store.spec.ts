import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { AbortError } from '$lib/utils';
import { fromLocalDateTimeToObject } from '$lib/utils/timeline-util';
import { type AssetResponseDto, type TimeBucketAssetResponseDto } from '@immich/sdk';
import { timelineAssetFactory, toResponseDto } from '@test-data/factories/asset-factory';
import { AssetStore, type TimelineAsset } from './assets-store.svelte';

async function getAssets(store: AssetStore) {
  const assets = [];
  for await (const asset of store.assetsIterator()) {
    assets.push(asset);
  }
  return assets;
}

describe('AssetStore', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('init', () => {
    let assetStore: AssetStore;
    const bucketAssets: Record<string, TimelineAsset[]> = {
      '2024-03-01T00:00:00.000Z': timelineAssetFactory
        .buildList(1)
        .map((asset) => ({ ...asset, localDateTime: fromLocalDateTimeToObject('2024-03-01T00:00:00.000Z') })),
      '2024-02-01T00:00:00.000Z': timelineAssetFactory
        .buildList(100)
        .map((asset) => ({ ...asset, localDateTime: fromLocalDateTimeToObject('2024-02-01T00:00:00.000Z') })),
      '2024-01-01T00:00:00.000Z': timelineAssetFactory
        .buildList(3)
        .map((asset) => ({ ...asset, localDateTime: fromLocalDateTimeToObject('2024-01-01T00:00:00.000Z') })),
    };

    const bucketAssetsResponse: Record<string, TimeBucketAssetResponseDto> = Object.fromEntries(
      Object.entries(bucketAssets).map(([key, assets]) => [key, toResponseDto(...assets)]),
    );

    beforeEach(async () => {
      assetStore = new AssetStore();
      sdkMock.getTimeBuckets.mockResolvedValue([
        { count: 1, timeBucket: '2024-03-01T00:00:00.000Z' },
        { count: 100, timeBucket: '2024-02-01T00:00:00.000Z' },
        { count: 3, timeBucket: '2024-01-01T00:00:00.000Z' },
      ]);

      sdkMock.getTimeBucket.mockImplementation(({ timeBucket }) => Promise.resolve(bucketAssetsResponse[timeBucket]));
      await assetStore.updateViewport({ width: 1588, height: 1000 });
    });

    it('should load buckets in viewport', () => {
      expect(sdkMock.getTimeBuckets).toBeCalledTimes(1);
      expect(sdkMock.getTimeBucket).toHaveBeenCalledTimes(2);
    });

    it('calculates bucket height', () => {
      const plainBuckets = assetStore.buckets.map((bucket) => ({
        year: bucket.yearMonth.year,
        month: bucket.yearMonth.month,
        bucketHeight: bucket.bucketHeight,
      }));

      expect(plainBuckets).toEqual(
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

  describe('loadBucket', () => {
    let assetStore: AssetStore;
    const bucketAssets: Record<string, TimelineAsset[]> = {
      '2024-01-03T00:00:00.000Z': timelineAssetFactory
        .buildList(1)
        .map((asset) => ({ ...asset, localDateTime: fromLocalDateTimeToObject('2024-03-01T00:00:00.000Z') })),
      '2024-01-01T00:00:00.000Z': timelineAssetFactory
        .buildList(3)
        .map((asset) => ({ ...asset, localDateTime: fromLocalDateTimeToObject('2024-01-01T00:00:00.000Z') })),
    };
    const bucketAssetsResponse: Record<string, TimeBucketAssetResponseDto> = Object.fromEntries(
      Object.entries(bucketAssets).map(([key, assets]) => [key, toResponseDto(...assets)]),
    );
    beforeEach(async () => {
      assetStore = new AssetStore();
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

    it('loads a bucket', async () => {
      expect(assetStore.getBucketByDate({ year: 2024, month: 1 })?.getAssets().length).toEqual(0);
      await assetStore.loadBucket({ year: 2024, month: 1 });
      expect(sdkMock.getTimeBucket).toBeCalledTimes(1);
      expect(assetStore.getBucketByDate({ year: 2024, month: 1 })?.getAssets().length).toEqual(3);
    });

    it('ignores invalid buckets', async () => {
      await assetStore.loadBucket({ year: 2023, month: 1 });
      expect(sdkMock.getTimeBucket).toBeCalledTimes(0);
    });

    it('cancels bucket loading', async () => {
      const bucket = assetStore.getBucketByDate({ year: 2024, month: 1 })!;
      void assetStore.loadBucket({ year: 2024, month: 1 });
      const abortSpy = vi.spyOn(bucket!.loader!.cancelToken!, 'abort');
      bucket?.cancel();
      expect(abortSpy).toBeCalledTimes(1);
      await assetStore.loadBucket({ year: 2024, month: 1 });
      expect(assetStore.getBucketByDate({ year: 2024, month: 1 })?.getAssets().length).toEqual(3);
    });

    it('prevents loading buckets multiple times', async () => {
      await Promise.all([
        assetStore.loadBucket({ year: 2024, month: 1 }),
        assetStore.loadBucket({ year: 2024, month: 1 }),
      ]);
      expect(sdkMock.getTimeBucket).toBeCalledTimes(1);

      await assetStore.loadBucket({ year: 2024, month: 1 });
      expect(sdkMock.getTimeBucket).toBeCalledTimes(1);
    });

    it('allows loading a canceled bucket', async () => {
      const bucket = assetStore.getBucketByDate({ year: 2024, month: 1 })!;
      const loadPromise = assetStore.loadBucket({ year: 2024, month: 1 });

      bucket.cancel();
      await loadPromise;
      expect(bucket?.getAssets().length).toEqual(0);

      await assetStore.loadBucket({ year: 2024, month: 1 });
      expect(bucket!.getAssets().length).toEqual(3);
    });
  });

  describe('addAssets', () => {
    let assetStore: AssetStore;

    beforeEach(async () => {
      assetStore = new AssetStore();
      sdkMock.getTimeBuckets.mockResolvedValue([]);

      await assetStore.updateViewport({ width: 1588, height: 1000 });
    });

    it('is empty initially', () => {
      expect(assetStore.buckets.length).toEqual(0);
      expect(assetStore.count).toEqual(0);
    });

    it('adds assets to new bucket', () => {
      const asset = timelineAssetFactory.build({
        localDateTime: fromLocalDateTimeToObject('2024-01-20T12:00:00.000Z'),
      });
      assetStore.addAssets([asset]);

      expect(assetStore.buckets.length).toEqual(1);
      expect(assetStore.count).toEqual(1);
      expect(assetStore.buckets[0].getAssets().length).toEqual(1);
      expect(assetStore.buckets[0].yearMonth.year).toEqual(2024);
      expect(assetStore.buckets[0].yearMonth.month).toEqual(1);
      expect(assetStore.buckets[0].getFirstAsset().id).toEqual(asset.id);
    });

    it('adds assets to existing bucket', () => {
      const [assetOne, assetTwo] = timelineAssetFactory.buildList(2, {
        localDateTime: fromLocalDateTimeToObject('2024-01-20T12:00:00.000Z'),
      });
      assetStore.addAssets([assetOne]);
      assetStore.addAssets([assetTwo]);

      expect(assetStore.buckets.length).toEqual(1);
      expect(assetStore.count).toEqual(2);
      expect(assetStore.buckets[0].getAssets().length).toEqual(2);
      expect(assetStore.buckets[0].yearMonth.year).toEqual(2024);
      expect(assetStore.buckets[0].yearMonth.month).toEqual(1);
    });

    it('orders assets in buckets by descending date', () => {
      const assetOne = timelineAssetFactory.build({
        localDateTime: fromLocalDateTimeToObject('2024-01-20T12:00:00.000Z'),
      });
      const assetTwo = timelineAssetFactory.build({
        localDateTime: fromLocalDateTimeToObject('2024-01-15T12:00:00.000Z'),
      });
      const assetThree = timelineAssetFactory.build({
        localDateTime: fromLocalDateTimeToObject('2024-01-16T12:00:00.000Z'),
      });
      assetStore.addAssets([assetOne, assetTwo, assetThree]);

      const bucket = assetStore.getBucketByDate({ year: 2024, month: 1 });
      expect(bucket).not.toBeNull();
      expect(bucket?.getAssets().length).toEqual(3);
      expect(bucket?.getAssets()[0].id).toEqual(assetOne.id);
      expect(bucket?.getAssets()[1].id).toEqual(assetThree.id);
      expect(bucket?.getAssets()[2].id).toEqual(assetTwo.id);
    });

    it('orders buckets by descending date', () => {
      const assetOne = timelineAssetFactory.build({
        localDateTime: fromLocalDateTimeToObject('2024-01-20T12:00:00.000Z'),
      });
      const assetTwo = timelineAssetFactory.build({
        localDateTime: fromLocalDateTimeToObject('2024-04-20T12:00:00.000Z'),
      });
      const assetThree = timelineAssetFactory.build({
        localDateTime: fromLocalDateTimeToObject('2023-01-20T12:00:00.000Z'),
      });
      assetStore.addAssets([assetOne, assetTwo, assetThree]);

      expect(assetStore.buckets.length).toEqual(3);
      expect(assetStore.buckets[0].yearMonth.year).toEqual(2024);
      expect(assetStore.buckets[0].yearMonth.month).toEqual(4);

      expect(assetStore.buckets[1].yearMonth.year).toEqual(2024);
      expect(assetStore.buckets[1].yearMonth.month).toEqual(1);

      expect(assetStore.buckets[2].yearMonth.year).toEqual(2023);
      expect(assetStore.buckets[2].yearMonth.month).toEqual(1);
    });

    it('updates existing asset', () => {
      const updateAssetsSpy = vi.spyOn(assetStore, 'updateAssets');
      const asset = timelineAssetFactory.build();
      assetStore.addAssets([asset]);

      assetStore.addAssets([asset]);
      expect(updateAssetsSpy).toBeCalledWith([asset]);
      expect(assetStore.count).toEqual(1);
    });

    // disabled due to the wasm Justified Layout import
    it('ignores trashed assets when isTrashed is true', async () => {
      const asset = timelineAssetFactory.build({ isTrashed: false });
      const trashedAsset = timelineAssetFactory.build({ isTrashed: true });

      const assetStore = new AssetStore();
      await assetStore.updateOptions({ isTrashed: true });
      assetStore.addAssets([asset, trashedAsset]);
      expect(getAssets(assetStore)).toEqual([trashedAsset]);
    });
  });

  describe('updateAssets', () => {
    let assetStore: AssetStore;

    beforeEach(async () => {
      assetStore = new AssetStore();
      sdkMock.getTimeBuckets.mockResolvedValue([]);

      await assetStore.updateViewport({ width: 1588, height: 1000 });
    });

    it('ignores non-existing assets', () => {
      assetStore.updateAssets([timelineAssetFactory.build()]);

      expect(assetStore.buckets.length).toEqual(0);
      expect(assetStore.count).toEqual(0);
    });

    it('updates an asset', () => {
      const asset = timelineAssetFactory.build({ isFavorite: false });
      const updatedAsset = { ...asset, isFavorite: true };

      assetStore.addAssets([asset]);
      expect(assetStore.count).toEqual(1);
      expect(assetStore.buckets[0].getFirstAsset().isFavorite).toEqual(false);

      assetStore.updateAssets([updatedAsset]);
      expect(assetStore.count).toEqual(1);
      expect(assetStore.buckets[0].getFirstAsset().isFavorite).toEqual(true);
    });

    it('asset moves buckets when asset date changes', () => {
      const asset = timelineAssetFactory.build({
        localDateTime: fromLocalDateTimeToObject('2024-01-20T12:00:00.000Z'),
      });
      const updatedAsset = { ...asset, localDateTime: fromLocalDateTimeToObject('2024-03-20T12:00:00.000Z') };

      assetStore.addAssets([asset]);
      expect(assetStore.buckets.length).toEqual(1);
      expect(assetStore.getBucketByDate({ year: 2024, month: 1 })).not.toBeUndefined();
      expect(assetStore.getBucketByDate({ year: 2024, month: 1 })?.getAssets().length).toEqual(1);

      assetStore.updateAssets([updatedAsset]);
      expect(assetStore.buckets.length).toEqual(2);
      expect(assetStore.getBucketByDate({ year: 2024, month: 1 })).not.toBeUndefined();
      expect(assetStore.getBucketByDate({ year: 2024, month: 1 })?.getAssets().length).toEqual(0);
      expect(assetStore.getBucketByDate({ year: 2024, month: 3 })).not.toBeUndefined();
      expect(assetStore.getBucketByDate({ year: 2024, month: 3 })?.getAssets().length).toEqual(1);
    });
  });

  describe('removeAssets', () => {
    let assetStore: AssetStore;

    beforeEach(async () => {
      assetStore = new AssetStore();
      sdkMock.getTimeBuckets.mockResolvedValue([]);

      await assetStore.updateViewport({ width: 1588, height: 1000 });
    });

    it('ignores invalid IDs', () => {
      assetStore.addAssets(
        timelineAssetFactory.buildList(2, { localDateTime: fromLocalDateTimeToObject('2024-01-20T12:00:00.000Z') }),
      );
      assetStore.removeAssets(['', 'invalid', '4c7d9acc']);

      expect(assetStore.count).toEqual(2);
      expect(assetStore.buckets.length).toEqual(1);
      expect(assetStore.buckets[0].getAssets().length).toEqual(2);
    });

    it('removes asset from bucket', () => {
      const [assetOne, assetTwo] = timelineAssetFactory.buildList(2, {
        localDateTime: fromLocalDateTimeToObject('2024-01-20T12:00:00.000Z'),
      });
      assetStore.addAssets([assetOne, assetTwo]);
      assetStore.removeAssets([assetOne.id]);

      expect(assetStore.count).toEqual(1);
      expect(assetStore.buckets.length).toEqual(1);
      expect(assetStore.buckets[0].getAssets().length).toEqual(1);
    });

    it('does not remove bucket when empty', () => {
      const assets = timelineAssetFactory.buildList(2, {
        localDateTime: fromLocalDateTimeToObject('2024-01-20T12:00:00.000Z'),
      });
      assetStore.addAssets(assets);
      assetStore.removeAssets(assets.map((asset) => asset.id));

      expect(assetStore.count).toEqual(0);
      expect(assetStore.buckets.length).toEqual(1);
    });
  });

  describe('firstAsset', () => {
    let assetStore: AssetStore;

    beforeEach(async () => {
      assetStore = new AssetStore();
      sdkMock.getTimeBuckets.mockResolvedValue([]);
      await assetStore.updateViewport({ width: 0, height: 0 });
    });

    it('empty store returns null', () => {
      expect(assetStore.getFirstAsset()).toBeUndefined();
    });

    it('populated store returns first asset', () => {
      const assetOne = timelineAssetFactory.build({
        localDateTime: fromLocalDateTimeToObject('2024-01-20T12:00:00.000Z'),
      });
      const assetTwo = timelineAssetFactory.build({
        localDateTime: fromLocalDateTimeToObject('2024-01-15T12:00:00.000Z'),
      });
      assetStore.addAssets([assetOne, assetTwo]);
      expect(assetStore.getFirstAsset()).toEqual(assetOne);
    });
  });

  describe('getLaterAsset', () => {
    let assetStore: AssetStore;
    const bucketAssets: Record<string, TimelineAsset[]> = {
      '2024-03-01T00:00:00.000Z': timelineAssetFactory
        .buildList(1)
        .map((asset) => ({ ...asset, localDateTime: fromLocalDateTimeToObject('2024-03-01T00:00:00.000Z') })),
      '2024-02-01T00:00:00.000Z': timelineAssetFactory
        .buildList(6)
        .map((asset) => ({ ...asset, localDateTime: fromLocalDateTimeToObject('2024-02-01T00:00:00.000Z') })),
      '2024-01-01T00:00:00.000Z': timelineAssetFactory
        .buildList(3)
        .map((asset) => ({ ...asset, localDateTime: fromLocalDateTimeToObject('2024-01-01T00:00:00.000Z') })),
    };
    const bucketAssetsResponse: Record<string, TimeBucketAssetResponseDto> = Object.fromEntries(
      Object.entries(bucketAssets).map(([key, assets]) => [key, toResponseDto(...assets)]),
    );

    beforeEach(async () => {
      assetStore = new AssetStore();
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
      await assetStore.loadBucket({ year: 2024, month: 1 });
      const bucket = assetStore.getBucketByDate({ year: 2024, month: 1 });

      const a = bucket!.getAssets()[0];
      const b = bucket!.getAssets()[1];
      const previous = await assetStore.getLaterAsset(b);
      expect(previous).toEqual(a);
    });

    it('returns previous assetId spanning multiple buckets', async () => {
      await assetStore.loadBucket({ year: 2024, month: 2 });
      await assetStore.loadBucket({ year: 2024, month: 3 });

      const bucket = assetStore.getBucketByDate({ year: 2024, month: 2 });
      const previousBucket = assetStore.getBucketByDate({ year: 2024, month: 3 });
      const a = bucket!.getAssets()[0];
      const b = previousBucket!.getAssets()[0];
      const previous = await assetStore.getLaterAsset(a);
      expect(previous).toEqual(b);
    });

    it('loads previous bucket', async () => {
      await assetStore.loadBucket({ year: 2024, month: 2 });

      const loadBucketSpy = vi.spyOn(assetStore, 'loadBucket');
      const bucket = assetStore.getBucketByDate({ year: 2024, month: 2 });
      const previousBucket = assetStore.getBucketByDate({ year: 2024, month: 3 });
      const a = bucket!.getAssets()[0];
      const b = previousBucket!.getAssets()[0];
      const previous = await assetStore.getLaterAsset(a);
      expect(previous).toEqual(b);
      expect(loadBucketSpy).toBeCalledTimes(1);
    });

    it('skips removed assets', async () => {
      await assetStore.loadBucket({ year: 2024, month: 1 });
      await assetStore.loadBucket({ year: 2024, month: 2 });
      await assetStore.loadBucket({ year: 2024, month: 3 });

      const [assetOne, assetTwo, assetThree] = await getAssets(assetStore);
      assetStore.removeAssets([assetTwo.id]);
      expect(await assetStore.getLaterAsset(assetThree)).toEqual(assetOne);
    });

    it('returns null when no more assets', async () => {
      await assetStore.loadBucket({ year: 2024, month: 3 });
      expect(await assetStore.getLaterAsset(assetStore.buckets[0].getFirstAsset())).toBeUndefined();
    });
  });

  describe('getBucketIndexByAssetId', () => {
    let assetStore: AssetStore;

    beforeEach(async () => {
      assetStore = new AssetStore();
      sdkMock.getTimeBuckets.mockResolvedValue([]);

      await assetStore.updateViewport({ width: 0, height: 0 });
    });

    it('returns null for invalid buckets', () => {
      expect(assetStore.getBucketByDate({ year: -1, month: -1 })).toBeUndefined();
      expect(assetStore.getBucketByDate({ year: 2024, month: 3 })).toBeUndefined();
    });

    it('returns the bucket index', () => {
      const assetOne = timelineAssetFactory.build({
        localDateTime: fromLocalDateTimeToObject('2024-01-20T12:00:00.000Z'),
      });
      const assetTwo = timelineAssetFactory.build({
        localDateTime: fromLocalDateTimeToObject('2024-02-15T12:00:00.000Z'),
      });
      assetStore.addAssets([assetOne, assetTwo]);

      expect(assetStore.getBucketIndexByAssetId(assetTwo.id)?.yearMonth.year).toEqual(2024);
      expect(assetStore.getBucketIndexByAssetId(assetTwo.id)?.yearMonth.month).toEqual(2);
      expect(assetStore.getBucketIndexByAssetId(assetOne.id)?.yearMonth.year).toEqual(2024);
      expect(assetStore.getBucketIndexByAssetId(assetOne.id)?.yearMonth.month).toEqual(1);
    });

    it('ignores removed buckets', () => {
      const assetOne = timelineAssetFactory.build({
        localDateTime: fromLocalDateTimeToObject('2024-01-20T12:00:00.000Z'),
      });
      const assetTwo = timelineAssetFactory.build({
        localDateTime: fromLocalDateTimeToObject('2024-02-15T12:00:00.000Z'),
      });
      assetStore.addAssets([assetOne, assetTwo]);

      assetStore.removeAssets([assetTwo.id]);
      expect(assetStore.getBucketIndexByAssetId(assetOne.id)?.yearMonth.year).toEqual(2024);
      expect(assetStore.getBucketIndexByAssetId(assetOne.id)?.yearMonth.month).toEqual(1);
    });
  });
});
