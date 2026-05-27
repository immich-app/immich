import type { CommonPosition } from '$lib/utils/layout-utils';
import { calculateViewerAssetIsInOrNearViewport } from './internal/intersection-support.svelte';
import type { TimelineDay } from './timeline-day.svelte';
import type { TimelineAsset } from './types';

export class ViewerAsset {
  readonly #group: TimelineDay;

  #isInOrNearViewport = $derived.by(() => {
    if (!this.position) {
      return false;
    }

    const store = this.#group.timelineMonth.timelineManager;
    const positionTop = this.#group.absoluteTimelineDayTop + this.position.top;

    return calculateViewerAssetIsInOrNearViewport(store, positionTop, this.position.height);
  });

  get isInOrNearViewport() {
    return this.#isInOrNearViewport;
  }

  position: CommonPosition | undefined = $state.raw();
  asset: TimelineAsset = $state() as TimelineAsset;
  id: string = $derived(this.asset.id);

  constructor(group: TimelineDay, asset: TimelineAsset) {
    this.#group = group;
    this.asset = asset;
  }
}
