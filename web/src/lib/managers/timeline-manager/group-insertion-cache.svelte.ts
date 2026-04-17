import { setDifference, type TimelineDate } from '$lib/utils/timeline-util';
import { AssetOrder } from '@immich/sdk';
import type { TimelineDay } from './timeline-day.svelte';
import type { TimelineMonth } from './timeline-month.svelte';
import type { TimelineAsset } from './types';

export class GroupInsertionCache {
  #lookupCache: {
    [year: number]: { [month: number]: { [day: number]: TimelineDay } };
  } = {};
  unprocessedAssets: TimelineAsset[] = [];
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  changedTimelineDays = new Set<TimelineDay>();
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  newTimelineDays = new Set<TimelineDay>();

  getTimelineDay({ year, month, day }: TimelineDate): TimelineDay | undefined {
    return this.#lookupCache[year]?.[month]?.[day];
  }

  setTimelineDay(timelineDay: TimelineDay, { year, month, day }: TimelineDate) {
    if (!this.#lookupCache[year]) {
      this.#lookupCache[year] = {};
    }
    if (!this.#lookupCache[year][month]) {
      this.#lookupCache[year][month] = {};
    }
    this.#lookupCache[year][month][day] = timelineDay;
  }

  get existingTimelineDays() {
    return setDifference(this.changedTimelineDays, this.newTimelineDays);
  }

  get updatedBuckets() {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const updated = new Set<TimelineMonth>();
    for (const group of this.changedTimelineDays) {
      updated.add(group.timelineMonth);
    }
    return updated;
  }

  get bucketsWithNewTimelineDays() {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const updated = new Set<TimelineMonth>();
    for (const group of this.newTimelineDays) {
      updated.add(group.timelineMonth);
    }
    return updated;
  }

  sort(timelineMonth: TimelineMonth, sortOrder: AssetOrder = AssetOrder.Desc) {
    for (const group of this.changedTimelineDays) {
      group.sortAssets(sortOrder);
    }
    for (const group of this.newTimelineDays) {
      group.sortAssets(sortOrder);
    }
    if (this.newTimelineDays.size > 0) {
      timelineMonth.sortTimelineDays();
    }
  }
}
