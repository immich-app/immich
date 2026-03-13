import type { CommonPosition } from '$lib/utils/layout-utils';

import type { DayGroup } from './day-group.svelte';
import { calculateViewerAssetIntersecting } from './internal/intersection-support.svelte';
import type { TimelineAsset } from './types';

export class ViewerAsset {
  readonly #group: DayGroup;

  intersecting = $state(false);

  updateIntersecting() {
    if (!this.position) {
      this.intersecting = false;
      return;
    }

    const store = this.#group.monthGroup.timelineManager;
    const positionTop = this.#group.absoluteDayGroupTop + this.position.top;

    this.intersecting = calculateViewerAssetIntersecting(store, positionTop, this.position.height);
  }

  position: CommonPosition | undefined = $state.raw();
  asset: TimelineAsset = <TimelineAsset>$state();
  id: string = $derived(this.asset.id);
  // asset: TimelineAsset;
  // id: string;

  constructor(group: DayGroup, asset: TimelineAsset) {
    this.#group = group;
    this.asset = asset;
    // this.id = asset.id;
  }
}
