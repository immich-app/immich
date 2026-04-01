import type { CommonPosition } from '$lib/utils/layout-utils';

import type { DayGroup } from './day-group.svelte';
import {
  ViewportProximity,
  calculateViewerAssetViewportProximity,
  isInOrNearViewport,
} from './internal/intersection-support.svelte';
import type { TimelineAsset } from './types';

export class ViewerAsset {
  readonly #group: DayGroup;

  #viewportProximity = $derived.by(() => {
    if (!this.position) {
      return ViewportProximity.FarFromViewport;
    }

    const store = this.#group.monthGroup.timelineManager;
    const positionTop = this.#group.absoluteDayGroupTop + this.position.top;

    return calculateViewerAssetViewportProximity(store, positionTop, this.position.height);
  });

  get isInOrNearViewport() {
    return isInOrNearViewport(this.#viewportProximity);
  }

  position: CommonPosition | undefined = $state.raw();
  asset: TimelineAsset = <TimelineAsset>$state();
  id: string = $derived(this.asset.id);

  constructor(group: DayGroup, asset: TimelineAsset) {
    this.#group = group;
    this.asset = asset;
  }
}
