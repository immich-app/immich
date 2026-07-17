import type { CommonPosition } from '$lib/utils/layout-utils';
import type { TimelineAsset } from './types';

export class ViewerAsset {
  position: CommonPosition | undefined = $state.raw();
  asset: TimelineAsset = $state() as TimelineAsset;
  id: string = $derived(this.asset.id);

  constructor(asset: TimelineAsset) {
    this.asset = asset;
  }
}
