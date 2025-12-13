import { setDifference, type TimelineDate } from '$lib/utils/timeline-util';
import { AssetOrder } from '@immich/sdk';
import type { DayGroup } from './day-group.svelte';
import type { MonthGroup } from './month-group.svelte';
import type { TimelineAsset } from './types';

export class GroupInsertionCache {
  #lookupCache: {
    [year: number]: { [month: number]: { [day: number]: DayGroup } };
  } = {};
  unprocessedAssets: TimelineAsset[] = [];
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  changedDayGroups = new Set<DayGroup>();
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  newDayGroups = new Set<DayGroup>();

  getDayGroup({ year, month, day }: TimelineDate): DayGroup | undefined {
    return this.#lookupCache[year]?.[month]?.[day];
  }

  setDayGroup(dayGroup: DayGroup, { year, month, day }: TimelineDate) {
    if (!this.#lookupCache[year]) {
      this.#lookupCache[year] = {};
    }
    if (!this.#lookupCache[year][month]) {
      this.#lookupCache[year][month] = {};
    }
    this.#lookupCache[year][month][day] = dayGroup;
  }

  get existingDayGroups() {
    return setDifference(this.changedDayGroups, this.newDayGroups);
  }

  get updatedBuckets() {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const updated = new Set<MonthGroup>();
    for (const group of this.changedDayGroups) {
      updated.add(group.monthGroup);
    }
    return updated;
  }

  get bucketsWithNewDayGroups() {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
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
