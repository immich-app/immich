import type { TimelinePlainDate } from '$lib/utils/timeline-util';
import { AssetOrder } from '@immich/sdk';
import type { AssetBucket } from './asset-bucket.svelte';
import type { AssetDateGroup } from './asset-date-group.svelte';
import type { TimelineAsset } from './types';

export class AddContext {
  #lookupCache: {
    [year: number]: { [month: number]: { [day: number]: AssetDateGroup } };
  } = {};
  unprocessedAssets: TimelineAsset[] = [];
  changedDateGroups = new Set<AssetDateGroup>();
  newDateGroups = new Set<AssetDateGroup>();

  getDateGroup({ year, month, day }: TimelinePlainDate): AssetDateGroup | undefined {
    return this.#lookupCache[year]?.[month]?.[day];
  }

  setDateGroup(dateGroup: AssetDateGroup, { year, month, day }: TimelinePlainDate) {
    if (!this.#lookupCache[year]) {
      this.#lookupCache[year] = {};
    }
    if (!this.#lookupCache[year][month]) {
      this.#lookupCache[year][month] = {};
    }
    this.#lookupCache[year][month][day] = dateGroup;
  }

  get existingDateGroups() {
    return this.changedDateGroups.difference(this.newDateGroups);
  }

  get updatedBuckets() {
    const updated = new Set<AssetBucket>();
    for (const group of this.changedDateGroups) {
      updated.add(group.bucket);
    }
    return updated;
  }

  get bucketsWithNewDateGroups() {
    const updated = new Set<AssetBucket>();
    for (const group of this.newDateGroups) {
      updated.add(group.bucket);
    }
    return updated;
  }

  sort(bucket: AssetBucket, sortOrder: AssetOrder = AssetOrder.Desc) {
    for (const group of this.changedDateGroups) {
      group.sortAssets(sortOrder);
    }
    for (const group of this.newDateGroups) {
      group.sortAssets(sortOrder);
    }
    if (this.newDateGroups.size > 0) {
      bucket.sortDateGroups();
    }
  }
}
