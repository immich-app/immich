import type { CommonPosition } from '$lib/utils/layout-utils';
import { TUNABLES } from '$lib/utils/tunables';

import type { DayGroup } from './day-group.svelte';
import type { TimelineAsset } from './types';

const {
  TIMELINE: { INTERSECTION_EXPAND_TOP, INTERSECTION_EXPAND_BOTTOM },
} = TUNABLES;

export class ViewerAsset {
  readonly #group: DayGroup;

  intersecting = $derived.by(() => {
    if (!this.position) {
      return false;
    }

    const store = this.#group.monthGroup.timelineManager;

    const scrollCompensation = store.scrollCompensation;
    const scrollCompensationHeightDelta = scrollCompensation?.heightDelta ?? 0;

    const topWindow =
      store.visibleWindow.top - store.headerHeight - INTERSECTION_EXPAND_TOP + scrollCompensationHeightDelta;
    const bottomWindow =
      store.visibleWindow.bottom + store.headerHeight + INTERSECTION_EXPAND_BOTTOM + scrollCompensationHeightDelta;
    const positionTop = this.#group.absoluteDayGroupTop + this.position.top;
    const positionBottom = positionTop + this.position.height;

    const intersecting =
      (positionTop >= topWindow && positionTop < bottomWindow) ||
      (positionBottom >= topWindow && positionBottom < bottomWindow) ||
      (positionTop < topWindow && positionBottom >= bottomWindow);
    return intersecting;
  });

  position: CommonPosition | undefined = $state();
  asset: TimelineAsset = <TimelineAsset>$state();
  id: string = $derived(this.asset.id);

  constructor(group: DayGroup, asset: TimelineAsset) {
    this.#group = group;
    this.asset = asset;
  }
}
