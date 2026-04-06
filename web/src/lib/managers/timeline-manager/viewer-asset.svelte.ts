import type { CommonPosition } from '$lib/utils/layout-utils';

import {
  ViewportProximity,
  calculateViewerAssetViewportProximity,
  isInOrNearViewport,
} from './internal/intersection-support.svelte';
import type { TimelineDay } from './timeline-day.svelte';
import type { TimelineAsset } from './types';

export class ViewerAsset {
  readonly #group: TimelineDay;

  #viewportProximity = $derived.by(() => {
    if (!this.position) {
      return ViewportProximity.FarFromViewport;
    }

    const store = this.#group.timelineMonth.timelineManager;
    const positionTop = this.#group.absoluteTimelineDayTop + this.position.top;

    return calculateViewerAssetViewportProximity(store, positionTop, this.position.height);
  });

  get isInOrNearViewport() {
    return isInOrNearViewport(this.#viewportProximity);
  }

  position: CommonPosition | undefined = $state.raw();
  asset: TimelineAsset = <TimelineAsset>$state();
  id: string = $derived(this.asset.id);

  constructor(group: TimelineDay, asset: TimelineAsset) {
    this.#group = group;
    this.asset = asset;
  }
}
