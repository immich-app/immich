import type { TimelinePlainDate } from '$lib/utils/timeline-util';
import { AssetOrder } from '@immich/sdk';
import type { DayGroup } from './day-group.svelte';
import type { MonthGroup } from './month-group.svelte';
import type { TimelineAsset } from './types';

export class GroupInsertionCache {
  #lookupCache: {
    [year: number]: { [month: number]: { [day: number]: DayGroup } };
  } = {};
  unprocessedAssets: TimelineAsset[] = [];
  changedDayGroups = new Set<DayGroup>();
  newDayGroups = new Set<DayGroup>();

  getDayGroup({ year, month, day }: TimelinePlainDate): DayGroup | undefined {
    return this.#lookupCache[year]?.[month]?.[day];
  }

  setDayGroup(dayGroup: DayGroup, { year, month, day }: TimelinePlainDate) {
    if (!this.#lookupCache[year]) {
      this.#lookupCache[year] = {};
    }
    if (!this.#lookupCache[year][month]) {
      this.#lookupCache[year][month] = {};
    }
    this.#lookupCache[year][month][day] = dayGroup;
  }

  get existingDayGroups() {
    return this.changedDayGroups.difference(this.newDayGroups);
  }

  get updatedBuckets() {
    const updated = new Set<MonthGroup>();
    for (const group of this.changedDayGroups) {
      updated.add(group.monthGroup);
    }
    return updated;
  }

  get bucketsWithNewDayGroups() {
    const updated = new Set<MonthGroup>();
    for (const group of this.newDayGroups) {
      updated.add(group.monthGroup);
    }
    return updated;
  }

  sort(monthGroup: MonthGroup, sortOrder: AssetOrder = AssetOrder.Desc) {
    for (const group of this.changedDayGroups) {
      group.sortAssets(sortOrder);
    }
    for (const group of this.newDayGroups) {
      group.sortAssets(sortOrder);
    }
    if (this.newDayGroups.size > 0) {
      monthGroup.sortDayGroups();
    }
  }
}
