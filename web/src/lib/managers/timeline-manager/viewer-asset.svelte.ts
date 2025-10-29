import type { CommonPosition } from '$lib/utils/layout-utils';

import type { DayGroup } from './day-group.svelte';
import { calculateViewerAssetIntersecting } from './internal/intersection-support.svelte';
import type { TimelineAsset } from './types';

export class ViewerAsset {
  readonly #group: DayGroup;

  intersecting = $derived.by(() => {
    if (!this.position) {
      return false;
    }

    const store = this.#group.monthGroup.timelineManager;
    const positionTop = this.#group.absoluteDayGroupTop + this.position.top;

    return calculateViewerAssetIntersecting(store, positionTop, this.position.height);
  });

  position: CommonPosition | undefined = $state.raw();
  asset: TimelineAsset = <TimelineAsset>$state();
  id: string = $derived(this.asset.id);

  constructor(group: DayGroup, asset: TimelineAsset) {
    this.#group = group;
    this.asset = asset;
  }
}
