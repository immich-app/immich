import { TimelineDay } from '$lib/managers/timeline-manager/TimelineDay.svelte';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { isIntersecting } from '$lib/managers/VirtualScrollManager/ScrollSegment.svelte';
import type { VirtualScrollManager } from '$lib/managers/VirtualScrollManager/VirtualScrollManager.svelte';

import type { CommonPosition } from '$lib/utils/layout-utils';
import { TUNABLES } from '$lib/utils/tunables';

const {
  TIMELINE: { INTERSECTION_EXPAND_TOP, INTERSECTION_EXPAND_BOTTOM },
} = TUNABLES;

export class ViewerAsset {
  readonly #day: TimelineDay;

  intersecting = $derived.by(() => {
    if (!this.position) {
      return false;
    }

    const scrollManager = this.#day.month.scrollManager;
    const positionTop = this.#day.topAbsolute + this.position.top;

    return calculateViewerAssetIntersecting(scrollManager, positionTop, this.position.height);
  });

  position: CommonPosition | undefined = $state.raw();
  asset: TimelineAsset = <TimelineAsset>$state();
  id: string = $derived(this.asset.id);

  constructor(day: TimelineDay, asset: TimelineAsset) {
    this.#day = day;
    this.asset = asset;
  }
}

/**
 * Calculate intersection for viewer assets with additional parameters like header height
 */
function calculateViewerAssetIntersecting(
  scrollManager: VirtualScrollManager,
  positionTop: number,
  positionHeight: number,
  expandTop: number = INTERSECTION_EXPAND_TOP,
  expandBottom: number = INTERSECTION_EXPAND_BOTTOM,
) {
  const topWindow = scrollManager.visibleWindow.top - scrollManager.headerHeight - expandTop;
  const bottomWindow = scrollManager.visibleWindow.bottom + scrollManager.headerHeight + expandBottom;
  const positionBottom = positionTop + positionHeight;
  return isIntersecting(positionTop, positionBottom, topWindow, bottomWindow);
}
