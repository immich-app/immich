import { calculateViewerAssetIntersecting } from '$lib/managers/timeline-manager/internal/intersection-support.svelte';
import { TimelineDay } from '$lib/managers/timeline-manager/TimelineDay.svelte';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import type { CommonPosition } from '$lib/utils/layout-utils';

export class ViewerAsset {
  readonly #day: TimelineDay;

  intersecting = $derived.by(() => {
    if (!this.position) {
      return false;
    }

    const store = this.#day.month.timelineManager;
    const positionTop = this.#day.absoluteTop + this.position.top;

    return calculateViewerAssetIntersecting(store, positionTop, this.position.height);
  });

  position: CommonPosition | undefined = $state.raw();
  asset: TimelineAsset = <TimelineAsset>$state();
  id: string = $derived(this.asset.id);

  constructor(day: TimelineDay, asset: TimelineAsset) {
    this.#day = day;
    this.asset = asset;
  }
}
