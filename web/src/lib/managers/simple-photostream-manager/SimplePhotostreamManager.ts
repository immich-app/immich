import { PhotostreamManager } from '$lib/managers/photostream-manager/PhotostreamManager.svelte';
import {
  PhotostreamSegment,
  type SegmentIdentifier,
} from '$lib/managers/photostream-manager/PhotostreamSegment.svelte';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { ViewerAsset } from '$lib/managers/timeline-manager/viewer-asset.svelte';

function createSimpleSegment(manager: SimplePhotostreamManager, assets: TimelineAsset[]) {
  class SimpleSegment extends PhotostreamSegment {
    #viewerAssets = $derived(assets.map((asset) => new ViewerAsset(this, asset)));
    #identifier = {
      matches: () => true,
    };
    get timelineManager(): PhotostreamManager {
      return manager;
    }
    get identifier(): SegmentIdentifier {
      return this.#identifier;
    }
    get id(): string {
      return 'one';
    }
    protected fetch(): Promise<void> {
      return Promise.resolve();
    }
    get viewerAssets(): ViewerAsset[] {
      return this.#viewerAssets;
    }
  }
  return new SimpleSegment();
}

export class SimplePhotostreamManager extends PhotostreamManager {
  #assets: TimelineAsset[] = $state([]);
  #segment: PhotostreamSegment;

  constructor() {
    super();
    this.#segment = createSimpleSegment(this, this.#assets);
  }

  set assets(assets: TimelineAsset[]) {
    this.#assets = assets;
  }

  get months(): PhotostreamSegment[] {
    return [this.#segment];
  }
}
