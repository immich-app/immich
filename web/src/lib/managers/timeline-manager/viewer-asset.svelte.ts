import type { CommonPosition } from '$lib/utils/layout-utils';

import type { DayGroup } from './day-group.svelte';
import { Intersection, calculateViewerAssetIntersecting } from './internal/intersection-support.svelte';
import type { TimelineAsset } from './types';

export class ViewerAsset {
  readonly #group: DayGroup;

  #intersection = $derived.by(() => {
    if (!this.position) {
      return Intersection.NONE;
    }

    const store = this.#group.monthGroup.timelineManager;
    const positionTop = this.#group.absoluteDayGroupTop + this.position.top;

    return calculateViewerAssetIntersecting(store, positionTop, this.position.height);
  });

  get intersecting() {
    return this.#intersection !== Intersection.NONE;
  }

  get actuallyIntersecting() {
    return this.#intersection === Intersection.ACTUAL;
  }

  position: CommonPosition | undefined = $state.raw();
  asset: TimelineAsset = <TimelineAsset>$state();
  id: string = $derived(this.asset.id);

  constructor(group: DayGroup, asset: TimelineAsset) {
    this.#group = group;
    this.asset = asset;
  }
}
