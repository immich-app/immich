import type { TimelineDay } from '$lib/managers/timeline-manager/TimelineDay.svelte';
import type { TimelineMonth } from '$lib/managers/timeline-manager/TimelineMonth.svelte';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { setDifference, type TimelineDate } from '$lib/utils/timeline-util';
import { AssetOrder } from '@immich/sdk';

export class GroupInsertionCache {
  #lookupCache: {
    [year: number]: { [month: number]: { [day: number]: TimelineDay } };
  } = {};
  unprocessedAssets: TimelineAsset[] = [];
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  changedDays = new Set<TimelineDay>();
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  newDays = new Set<TimelineDay>();

  getDay({ year, month, day }: TimelineDate): TimelineDay | undefined {
    return this.#lookupCache[year]?.[month]?.[day];
  }

  setDay(day: TimelineDay, { year, month, day: dayNum }: TimelineDate) {
    if (!this.#lookupCache[year]) {
      this.#lookupCache[year] = {};
    }
    if (!this.#lookupCache[year][month]) {
      this.#lookupCache[year][month] = {};
    }
    this.#lookupCache[year][month][dayNum] = day;
  }

  get existingDays() {
    return setDifference(this.changedDays, this.newDays);
  }

  get updatedMonths() {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const months = new Set<TimelineMonth>();
    for (const day of this.changedDays) {
      months.add(day.month);
    }
    return months;
  }

  get monthsWithNewDays() {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const months = new Set<TimelineMonth>();
    for (const day of this.newDays) {
      months.add(day.month);
    }
    return months;
  }

  sort(month: TimelineMonth, sortOrder: AssetOrder = AssetOrder.Desc) {
    for (const day of this.changedDays) {
      day.sortAssets(sortOrder);
    }
    for (const day of this.newDays) {
      day.sortAssets(sortOrder);
    }
    if (this.newDays.size > 0) {
      month.sortDays();
    }
  }
}
