import type { CommonLayoutOptions } from '$lib/utils/layout-utils';
import { getJustifiedLayoutFromAssets, getPosition } from '$lib/utils/layout-utils';
import { plainDateTimeCompare } from '$lib/utils/timeline-util';
import { AssetOrder } from '@immich/sdk';
import type { AssetBucket } from './asset-bucket.svelte';
import { IntersectingAsset } from './intersecting-asset.svelte';
import type { AssetOperation, Direction, MoveAsset, TimelineAsset } from './types';

export class AssetDateGroup {
  readonly bucket: AssetBucket;
  readonly index: number;
  readonly groupTitle: string;
  readonly day: number;
  intersectingAssets: IntersectingAsset[] = $state([]);

  height = $state(0);
  width = $state(0);
  intersecting = $derived.by(() => this.intersectingAssets.some((asset) => asset.intersecting));

  #top: number = $state(0);
  #left: number = $state(0);
  #row = $state(0);
  #col = $state(0);
  #deferredLayout = false;

  constructor(bucket: AssetBucket, index: number, day: number, groupTitle: string) {
    this.index = index;
    this.bucket = bucket;
    this.day = day;
    this.groupTitle = groupTitle;
  }

  get top() {
    return this.#top;
  }

  set top(value: number) {
    this.#top = value;
  }

  get left() {
    return this.#left;
  }

  set left(value: number) {
    this.#left = value;
  }

  get row() {
    return this.#row;
  }

  set row(value: number) {
    this.#row = value;
  }

  get col() {
    return this.#col;
  }

  set col(value: number) {
    this.#col = value;
  }

  get deferredLayout() {
    return this.#deferredLayout;
  }

  set deferredLayout(value: boolean) {
    this.#deferredLayout = value;
  }

  sortAssets(sortOrder: AssetOrder = AssetOrder.Desc) {
    const sortFn = plainDateTimeCompare.bind(undefined, sortOrder === AssetOrder.Asc);
    this.intersectingAssets.sort((a, b) => sortFn(a.asset.localDateTime, b.asset.localDateTime));
  }

  getFirstAsset() {
    return this.intersectingAssets[0]?.asset;
  }

  getRandomAsset() {
    const random = Math.floor(Math.random() * this.intersectingAssets.length);
    return this.intersectingAssets[random];
  }

  *assetsIterator(options: { startAsset?: TimelineAsset; direction?: Direction } = {}) {
    const isEarlier = (options?.direction ?? 'earlier') === 'earlier';
    let assetIndex = options?.startAsset
      ? this.intersectingAssets.findIndex((intersectingAsset) => intersectingAsset.asset.id === options.startAsset!.id)
      : isEarlier
        ? 0
        : this.intersectingAssets.length - 1;

    while (assetIndex >= 0 && assetIndex < this.intersectingAssets.length) {
      const intersectingAsset = this.intersectingAssets[assetIndex];
      yield intersectingAsset.asset;
      assetIndex += isEarlier ? 1 : -1;
    }
  }

  getAssets() {
    return this.intersectingAssets.map((intersectingasset) => intersectingasset.asset);
  }

  runAssetOperation(ids: Set<string>, operation: AssetOperation) {
    if (ids.size === 0) {
      return {
        moveAssets: [] as MoveAsset[],
        processedIds: new Set<string>(),
        unprocessedIds: ids,
        changedGeometry: false,
      };
    }
    const unprocessedIds = new Set<string>(ids);
    const processedIds = new Set<string>();
    const moveAssets: MoveAsset[] = [];
    let changedGeometry = false;
    for (const assetId of unprocessedIds) {
      const index = this.intersectingAssets.findIndex((ia) => ia.id == assetId);
      if (index === -1) {
        continue;
      }

      const asset = this.intersectingAssets[index].asset!;
      const oldTime = { ...asset.localDateTime };
      let { remove } = operation(asset);
      const newTime = asset.localDateTime;
      if (oldTime.year !== newTime.year || oldTime.month !== newTime.month || oldTime.day !== newTime.day) {
        const { year, month, day } = newTime;
        remove = true;
        moveAssets.push({ asset, date: { year, month, day } });
      }
      unprocessedIds.delete(assetId);
      processedIds.add(assetId);
      if (remove || this.bucket.store.isExcluded(asset)) {
        this.intersectingAssets.splice(index, 1);
        changedGeometry = true;
      }
    }
    return { moveAssets, processedIds, unprocessedIds, changedGeometry };
  }

  layout(options: CommonLayoutOptions, noDefer: boolean) {
    if (!noDefer && !this.bucket.intersecting) {
      this.#deferredLayout = true;
      return;
    }
    const assets = this.intersectingAssets.map((intersetingAsset) => intersetingAsset.asset!);
    const geometry = getJustifiedLayoutFromAssets(assets, options);
    this.width = geometry.containerWidth;
    this.height = assets.length === 0 ? 0 : geometry.containerHeight;
    for (let i = 0; i < this.intersectingAssets.length; i++) {
      const position = getPosition(geometry, i);
      this.intersectingAssets[i].position = position;
    }
  }

  get absoluteDateGroupTop() {
    return this.bucket.top + this.#top;
  }
}
