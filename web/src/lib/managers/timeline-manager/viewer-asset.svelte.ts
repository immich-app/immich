import type { PhotostreamSegment } from '$lib/managers/photostream-manager/PhotostreamSegment.svelte';
import type { CommonPosition } from '$lib/utils/layout-utils';

import type { DayGroup } from './day-group.svelte';
import { calculateViewerAssetIntersecting } from './internal/intersection-support.svelte';
import type { TimelineAsset } from './types';

export class ViewerAsset {
  readonly #group: DayGroup | PhotostreamSegment;

  intersecting = $derived.by(() => {
    if (!this.position) {
      return false;
    }
    if ((this.#group as DayGroup).sortAssets) {
      const dayGroup = this.#group as DayGroup;
      const store = dayGroup.monthGroup.timelineManager;
      const positionTop = dayGroup.absoluteDayGroupTop + this.position.top;
      return calculateViewerAssetIntersecting(store, positionTop, this.position.height);
    }
    const store = (this.#group as PhotostreamSegment).timelineManager;
    const positionTop = this.position.top + (this.#group as PhotostreamSegment).top;

    return calculateViewerAssetIntersecting(store, positionTop, this.position.height);
  });

  position: CommonPosition | undefined = $state();
  asset: TimelineAsset = <TimelineAsset>$state();
  id: string = $derived(this.asset.id);

  constructor(group: DayGroup | PhotostreamSegment, asset: TimelineAsset) {
    this.#group = group;
    this.asset = asset;
  }
}
