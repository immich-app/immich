import { AssetOrder } from '@immich/sdk';

import type { CommonLayoutOptions } from '$lib/utils/layout-utils';
import { getJustifiedLayoutFromAssets, getPosition } from '$lib/utils/layout-utils';
import { plainDateTimeCompare } from '$lib/utils/timeline-util';

import type { MonthGroup } from './month-group.svelte';
import type { AssetOperation, Direction, MoveAsset, TimelineAsset } from './types';
import { ViewerAsset } from './viewer-asset.svelte';

export class DayGroup {
  readonly monthGroup: MonthGroup;
  readonly index: number;
  readonly groupTitle: string;
  readonly day: number;
  viewerAssets: ViewerAsset[] = $state([]);

  height = $state(0);
  width = $state(0);
  intersecting = $derived.by(() => this.viewerAssets.some((viewAsset) => viewAsset.intersecting));

  #top: number = $state(0);
  #left: number = $state(0);
  #row = $state(0);
  #col = $state(0);
  #deferredLayout = false;

  constructor(monthGroup: MonthGroup, index: number, day: number, groupTitle: string) {
    this.index = index;
    this.monthGroup = monthGroup;
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
    this.viewerAssets.sort((a, b) => sortFn(a.asset.fileCreatedAt, b.asset.fileCreatedAt));
  }

  getFirstAsset() {
    return this.viewerAssets[0]?.asset;
  }

  getRandomAsset() {
    const random = Math.floor(Math.random() * this.viewerAssets.length);
    return this.viewerAssets[random];
  }

  *assetsIterator(options: { startAsset?: TimelineAsset; direction?: Direction } = {}) {
    const isEarlier = (options?.direction ?? 'earlier') === 'earlier';
    let assetIndex = options?.startAsset
      ? this.viewerAssets.findIndex((viewerAsset) => viewerAsset.asset.id === options.startAsset!.id)
      : isEarlier
        ? 0
        : this.viewerAssets.length - 1;

    while (assetIndex >= 0 && assetIndex < this.viewerAssets.length) {
      const viewerAsset = this.viewerAssets[assetIndex];
      yield viewerAsset.asset;
      assetIndex += isEarlier ? 1 : -1;
    }
  }

  getAssets() {
    return this.viewerAssets.map((viewerAsset) => viewerAsset.asset);
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
      const index = this.viewerAssets.findIndex((viewAsset) => viewAsset.id == assetId);
      if (index === -1) {
        continue;
      }

      const asset = this.viewerAssets[index].asset!;
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
      if (remove || this.monthGroup.store.isExcluded(asset)) {
        this.viewerAssets.splice(index, 1);
        changedGeometry = true;
      }
    }
    return { moveAssets, processedIds, unprocessedIds, changedGeometry };
  }

  layout(options: CommonLayoutOptions, noDefer: boolean) {
    if (!noDefer && !this.monthGroup.intersecting) {
      this.#deferredLayout = true;
      return;
    }
    const assets = this.viewerAssets.map((viewerAsset) => viewerAsset.asset!);
    const geometry = getJustifiedLayoutFromAssets(assets, options);
    this.width = geometry.containerWidth;
    this.height = assets.length === 0 ? 0 : geometry.containerHeight;
    for (let i = 0; i < this.viewerAssets.length; i++) {
      const position = getPosition(geometry, i);
      this.viewerAssets[i].position = position;
    }
  }

  get absoluteDayGroupTop() {
    return this.monthGroup.top + this.#top;
  }
}
