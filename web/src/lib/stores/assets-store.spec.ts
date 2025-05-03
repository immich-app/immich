import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { AbortError } from '$lib/utils';
import { TimeBucketSize, type AssetResponseDto } from '@immich/sdk';
import { assetFactory } from '@test-data/factories/asset-factory';
import { AssetStore } from './assets-store.svelte';

describe('AssetStore', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('init', () => {
    let assetStore: AssetStore;
    const bucketAssets: Record<string, AssetResponseDto[]> = {
      '2024-03-01T00:00:00.000Z': assetFactory
        .buildList(1)
        .map((asset) => ({ ...asset, localDateTime: '2024-03-01T00:00:00.000Z' })),
      '2024-02-01T00:00:00.000Z': assetFactory
        .buildList(100)
        .map((asset) => ({ ...asset, localDateTime: '2024-02-01T00:00:00.000Z' })),
      '2024-01-01T00:00:00.000Z': assetFactory
        .buildList(3)
        .map((asset) => ({ ...asset, localDateTime: '2024-01-01T00:00:00.000Z' })),
    };

    beforeEach(async () => {
      assetStore = new AssetStore();
      sdkMock.getTimeBuckets.mockResolvedValue([
        { count: 1, timeBucket: '2024-03-01T00:00:00.000Z' },
        { count: 100, timeBucket: '2024-02-01T00:00:00.000Z' },
        { count: 3, timeBucket: '2024-01-01T00:00:00.000Z' },
      ]);
      sdkMock.getTimeBucket.mockImplementation(({ timeBucket }) => Promise.resolve(bucketAssets[timeBucket]));
      await assetStore.updateViewport({ width: 1588, height: 1000 });
    });

    it('should load buckets in viewport', () => {
      expect(sdkMock.getTimeBuckets).toBeCalledTimes(1);
      expect(sdkMock.getTimeBuckets).toBeCalledWith({ size: TimeBucketSize.Month });
      expect(sdkMock.getTimeBucket).toHaveBeenCalledTimes(2);
    });

    it('calculates bucket height', () => {
      const plainBuckets = assetStore.buckets.map((bucket) => ({
        bucketDate: bucket.bucketDate,
        bucketHeight: bucket.bucketHeight,
      }));

      expect(plainBuckets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ bucketDate: '2024-03-01T00:00:00.000Z', bucketHeight: 303 }),
          expect.objectContaining({ bucketDate: '2024-02-01T00:00:00.000Z', bucketHeight: 4514.333_333_333_333 }),
          expect.objectContaining({ bucketDate: '2024-01-01T00:00:00.000Z', bucketHeight: 286 }),
        ]),
      );
    });

    it('calculates timeline height', () => {
      expect(assetStore.timelineHeight).toBe(5103.333_333_333_333);
    });
  });

  describe('loadBucket', () => {
    let assetStore: AssetStore;
    const bucketAssets: Record<string, AssetResponseDto[]> = {
      '2024-01-03T00:00:00.000Z': assetFactory
        .buildList(1)
        .map((asset) => ({ ...asset, localDateTime: '2024-03-01T00:00:00.000Z' })),
      '2024-01-01T00:00:00.000Z': assetFactory
        .buildList(3)
        .map((asset) => ({ ...asset, localDateTime: '2024-01-01T00:00:00.000Z' })),
    };

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
        return bucketAssets[timeBucket];
      });
      await assetStore.updateViewport({ width: 1588, height: 0 });
    });

    it('loads a bucket', async () => {
      expect(assetStore.getBucketByDate(2024, 1)?.getAssets().length).toEqual(0);
      await assetStore.loadBucket('2024-01-01T00:00:00.000Z');
      expect(sdkMock.getTimeBucket).toBeCalledTimes(1);
      expect(assetStore.getBucketByDate(2024, 1)?.getAssets().length).toEqual(3);
    });

    it('ignores invalid buckets', async () => {
      await assetStore.loadBucket('2023-01-01T00:00:00.000Z');
      expect(sdkMock.getTimeBucket).toBeCalledTimes(0);
    });

    it('cancels bucket loading', async () => {
      const bucket = assetStore.getBucketByDate(2024, 1)!;
      void assetStore.loadBucket(bucket!.bucketDate);
      const abortSpy = vi.spyOn(bucket!.loader!.cancelToken!, 'abort');
      bucket?.cancel();
      expect(abortSpy).toBeCalledTimes(1);
      await assetStore.loadBucket(bucket!.bucketDate);
      expect(assetStore.getBucketByDate(2024, 1)?.getAssets().length).toEqual(3);
    });

    it('prevents loading buckets multiple times', async () => {
      await Promise.all([
        assetStore.loadBucket('2024-01-01T00:00:00.000Z'),
        assetStore.loadBucket('2024-01-01T00:00:00.000Z'),
      ]);
      expect(sdkMock.getTimeBucket).toBeCalledTimes(1);

      await assetStore.loadBucket('2024-01-01T00:00:00.000Z');
      expect(sdkMock.getTimeBucket).toBeCalledTimes(1);
    });

    it('allows loading a canceled bucket', async () => {
      const bucket = assetStore.getBucketByDate(2024, 1)!;
      const loadPromise = assetStore.loadBucket(bucket!.bucketDate);

      bucket.cancel();
      await loadPromise;
      expect(bucket?.getAssets().length).toEqual(0);

      await assetStore.loadBucket(bucket.bucketDate);
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
      expect(assetStore.getAssets().length).toEqual(0);
    });

    it('adds assets to new bucket', () => {
      const asset = assetFactory.build({
        localDateTime: '2024-01-20T12:00:00.000Z',
        fileCreatedAt: '2024-01-20T12:00:00.000Z',
      });
      assetStore.addAssets([asset]);

      expect(assetStore.buckets.length).toEqual(1);
      expect(assetStore.getAssets().length).toEqual(1);
      expect(assetStore.buckets[0].getAssets().length).toEqual(1);
      expect(assetStore.buckets[0].bucketDate).toEqual('2024-01-01T00:00:00.000Z');
      expect(assetStore.getAssets()[0].id).toEqual(asset.id);
    });

    it('adds assets to existing bucket', () => {
      const [assetOne, assetTwo] = assetFactory.buildList(2, {
        localDateTime: '2024-01-20T12:00:00.000Z',
        fileCreatedAt: '2024-01-20T12:00:00.000Z',
      });
      assetStore.addAssets([assetOne]);
      assetStore.addAssets([assetTwo]);

      expect(assetStore.buckets.length).toEqual(1);
      expect(assetStore.getAssets().length).toEqual(2);
      expect(assetStore.buckets[0].getAssets().length).toEqual(2);
      expect(assetStore.buckets[0].bucketDate).toEqual('2024-01-01T00:00:00.000Z');
    });

    it('orders assets in buckets by descending date', () => {
      const assetOne = assetFactory.build({
        fileCreatedAt: '2024-01-20T12:00:00.000Z',
        localDateTime: '2024-01-20T12:00:00.000Z',
      });
      const assetTwo = assetFactory.build({
        fileCreatedAt: '2024-01-15T12:00:00.000Z',
        localDateTime: '2024-01-15T12:00:00.000Z',
      });
      const assetThree = assetFactory.build({
        fileCreatedAt: '2024-01-16T12:00:00.000Z',
        localDateTime: '2024-01-16T12:00:00.000Z',
      });
      assetStore.addAssets([assetOne, assetTwo, assetThree]);

      const bucket = assetStore.getBucketByDate(2024, 1);
      expect(bucket).not.toBeNull();
      expect(bucket?.getAssets().length).toEqual(3);
      expect(bucket?.getAssets()[0].id).toEqual(assetOne.id);
      expect(bucket?.getAssets()[1].id).toEqual(assetThree.id);
      expect(bucket?.getAssets()[2].id).toEqual(assetTwo.id);
    });

    it('orders buckets by descending date', () => {
      const assetOne = assetFactory.build({ localDateTime: '2024-01-20T12:00:00.000Z' });
      const assetTwo = assetFactory.build({ localDateTime: '2024-04-20T12:00:00.000Z' });
      const assetThree = assetFactory.build({ localDateTime: '2023-01-20T12:00:00.000Z' });
      assetStore.addAssets([assetOne, assetTwo, assetThree]);

      expect(assetStore.buckets.length).toEqual(3);
      expect(assetStore.buckets[0].bucketDate).toEqual('2024-04-01T00:00:00.000Z');
      expect(assetStore.buckets[1].bucketDate).toEqual('2024-01-01T00:00:00.000Z');
      expect(assetStore.buckets[2].bucketDate).toEqual('2023-01-01T00:00:00.000Z');
    });

    it('updates existing asset', () => {
      const updateAssetsSpy = vi.spyOn(assetStore, 'updateAssets');
      const asset = assetFactory.build();
      assetStore.addAssets([asset]);

      assetStore.addAssets([asset]);
      expect(updateAssetsSpy).toBeCalledWith([asset]);
      expect(assetStore.getAssets().length).toEqual(1);
    });

    // disabled due to the wasm Justified Layout import
    it('ignores trashed assets when isTrashed is true', async () => {
      const asset = assetFactory.build({ isTrashed: false });
      const trashedAsset = assetFactory.build({ isTrashed: true });

      const assetStore = new AssetStore();
      await assetStore.updateOptions({ isTrashed: true });
      assetStore.addAssets([asset, trashedAsset]);
      expect(assetStore.getAssets()).toEqual([trashedAsset]);
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
      assetStore.updateAssets([assetFactory.build()]);

      expect(assetStore.buckets.length).toEqual(0);
      expect(assetStore.getAssets().length).toEqual(0);
    });

    it('updates an asset', () => {
      const asset = assetFactory.build({ isFavorite: false });
      const updatedAsset = { ...asset, isFavorite: true };

      assetStore.addAssets([asset]);
      expect(assetStore.getAssets().length).toEqual(1);
      expect(assetStore.getAssets()[0].isFavorite).toEqual(false);

      assetStore.updateAssets([updatedAsset]);
      expect(assetStore.getAssets().length).toEqual(1);
      expect(assetStore.getAssets()[0].isFavorite).toEqual(true);
    });

    it('asset moves buckets when asset date changes', () => {
      const asset = assetFactory.build({ localDateTime: '2024-01-20T12:00:00.000Z' });
      const updatedAsset = { ...asset, localDateTime: '2024-03-20T12:00:00.000Z' };

      assetStore.addAssets([asset]);
      expect(assetStore.buckets.length).toEqual(1);
      expect(assetStore.getBucketByDate(2024, 1)).not.toBeUndefined();
      expect(assetStore.getBucketByDate(2024, 1)?.getAssets().length).toEqual(1);

      assetStore.updateAssets([updatedAsset]);
      expect(assetStore.buckets.length).toEqual(2);
      expect(assetStore.getBucketByDate(2024, 1)).not.toBeUndefined();
      expect(assetStore.getBucketByDate(2024, 1)?.getAssets().length).toEqual(0);
      expect(assetStore.getBucketByDate(2024, 3)).not.toBeUndefined();
      expect(assetStore.getBucketByDate(2024, 3)?.getAssets().length).toEqual(1);
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
      assetStore.addAssets(assetFactory.buildList(2, { localDateTime: '2024-01-20T12:00:00.000Z' }));
      assetStore.removeAssets(['', 'invalid', '4c7d9acc']);

      expect(assetStore.getAssets().length).toEqual(2);
      expect(assetStore.buckets.length).toEqual(1);
      expect(assetStore.buckets[0].getAssets().length).toEqual(2);
    });

    it('removes asset from bucket', () => {
      const [assetOne, assetTwo] = assetFactory.buildList(2, { localDateTime: '2024-01-20T12:00:00.000Z' });
      assetStore.addAssets([assetOne, assetTwo]);
      assetStore.removeAssets([assetOne.id]);

      expect(assetStore.getAssets().length).toEqual(1);
      expect(assetStore.buckets.length).toEqual(1);
      expect(assetStore.buckets[0].getAssets().length).toEqual(1);
    });

    it('does not remove bucket when empty', () => {
      const assets = assetFactory.buildList(2, { localDateTime: '2024-01-20T12:00:00.000Z' });
      assetStore.addAssets(assets);
      assetStore.removeAssets(assets.map((asset) => asset.id));

      expect(assetStore.getAssets().length).toEqual(0);
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
      const assetOne = assetFactory.build({
        fileCreatedAt: '2024-01-20T12:00:00.000Z',
        localDateTime: '2024-01-20T12:00:00.000Z',
      });
      const assetTwo = assetFactory.build({
        fileCreatedAt: '2024-01-15T12:00:00.000Z',
        localDateTime: '2024-01-15T12:00:00.000Z',
      });
      assetStore.addAssets([assetOne, assetTwo]);
      expect(assetStore.getFirstAsset()).toEqual(assetOne);
    });
  });

  describe('getPreviousAsset', () => {
    let assetStore: AssetStore;
    const bucketAssets: Record<string, AssetResponseDto[]> = {
      '2024-03-01T00:00:00.000Z': assetFactory
        .buildList(1)
        .map((asset) => ({ ...asset, localDateTime: '2024-03-01T00:00:00.000Z' })),
      '2024-02-01T00:00:00.000Z': assetFactory
        .buildList(6)
        .map((asset) => ({ ...asset, localDateTime: '2024-02-01T00:00:00.000Z' })),
      '2024-01-01T00:00:00.000Z': assetFactory
        .buildList(3)
        .map((asset) => ({ ...asset, localDateTime: '2024-01-01T00:00:00.000Z' })),
    };

    beforeEach(async () => {
      assetStore = new AssetStore();
      sdkMock.getTimeBuckets.mockResolvedValue([
        { count: 1, timeBucket: '2024-03-01T00:00:00.000Z' },
        { count: 6, timeBucket: '2024-02-01T00:00:00.000Z' },
        { count: 3, timeBucket: '2024-01-01T00:00:00.000Z' },
      ]);
      sdkMock.getTimeBucket.mockImplementation(({ timeBucket }) => Promise.resolve(bucketAssets[timeBucket]));

      await assetStore.updateViewport({ width: 1588, height: 1000 });
    });

    it('returns null for invalid assetId', async () => {
      expect(() => assetStore.getPreviousAsset({ id: 'invalid' } as AssetResponseDto)).not.toThrow();
      expect(await assetStore.getPreviousAsset({ id: 'invalid' } as AssetResponseDto)).toBeUndefined();
    });

    it('returns previous assetId', async () => {
      await assetStore.loadBucket('2024-01-01T00:00:00.000Z');
      const bucket = assetStore.getBucketByDate(2024, 1);

      const a = bucket!.getAssets()[0];
      const b = bucket!.getAssets()[1];
      const previous = await assetStore.getPreviousAsset(b);
      expect(previous).toEqual(a);
    });

    it('returns previous assetId spanning multiple buckets', async () => {
      await assetStore.loadBucket('2024-02-01T00:00:00.000Z');
      await assetStore.loadBucket('2024-03-01T00:00:00.000Z');

      const bucket = assetStore.getBucketByDate(2024, 2);
      const previousBucket = assetStore.getBucketByDate(2024, 3);
      const a = bucket!.getAssets()[0];
      const b = previousBucket!.getAssets()[0];
      const previous = await assetStore.getPreviousAsset(a);
      expect(previous).toEqual(b);
    });

    it('loads previous bucket', async () => {
      await assetStore.loadBucket('2024-02-01T00:00:00.000Z');

      const loadBucketSpy = vi.spyOn(assetStore, 'loadBucket');
      const bucket = assetStore.getBucketByDate(2024, 2);
      const previousBucket = assetStore.getBucketByDate(2024, 3);
      const a = bucket!.getAssets()[0];
      const b = previousBucket!.getAssets()[0];
      const previous = await assetStore.getPreviousAsset(a);
      expect(previous).toEqual(b);
      expect(loadBucketSpy).toBeCalledTimes(1);
    });

    it('skips removed assets', async () => {
      await assetStore.loadBucket('2024-01-01T00:00:00.000Z');
      await assetStore.loadBucket('2024-02-01T00:00:00.000Z');
      await assetStore.loadBucket('2024-03-01T00:00:00.000Z');

      const [assetOne, assetTwo, assetThree] = assetStore.getAssets();
      assetStore.removeAssets([assetTwo.id]);
      expect(await assetStore.getPreviousAsset(assetThree)).toEqual(assetOne);
    });

    it('returns null when no more assets', async () => {
      await assetStore.loadBucket('2024-03-01T00:00:00.000Z');
      expect(await assetStore.getPreviousAsset(assetStore.getAssets()[0])).toBeUndefined();
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
      expect(assetStore.getBucketByDate(-1, -1)).toBeUndefined();
      expect(assetStore.getBucketByDate(2024, 3)).toBeUndefined();
    });

    it('returns the bucket index', () => {
      const assetOne = assetFactory.build({ localDateTime: '2024-01-20T12:00:00.000Z' });
      const assetTwo = assetFactory.build({ localDateTime: '2024-02-15T12:00:00.000Z' });
      assetStore.addAssets([assetOne, assetTwo]);

      expect(assetStore.getBucketIndexByAssetId(assetTwo.id)?.bucketDate).toEqual('2024-02-01T00:00:00.000Z');
      expect(assetStore.getBucketIndexByAssetId(assetOne.id)?.bucketDate).toEqual('2024-01-01T00:00:00.000Z');
    });

    it('ignores removed buckets', () => {
      const assetOne = assetFactory.build({ localDateTime: '2024-01-20T12:00:00.000Z' });
      const assetTwo = assetFactory.build({ localDateTime: '2024-02-15T12:00:00.000Z' });
      assetStore.addAssets([assetOne, assetTwo]);

      assetStore.removeAssets([assetTwo.id]);
      expect(assetStore.getBucketIndexByAssetId(assetOne.id)?.bucketDate).toEqual('2024-01-01T00:00:00.000Z');
    });
  });
});
