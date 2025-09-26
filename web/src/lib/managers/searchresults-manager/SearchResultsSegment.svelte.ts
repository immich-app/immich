import {
  PhotostreamSegment,
  type SegmentIdentifier,
} from '$lib/managers/photostream-manager/PhotostreamSegment.svelte';
import type {
  SearchResultsManager,
  SearchTerms,
} from '$lib/managers/searchresults-manager/SearchResultsManager.svelte';
import { ViewerAsset } from '$lib/managers/timeline-manager/viewer-asset.svelte';
import { getJustifiedLayoutFromAssets, getPosition } from '$lib/utils/layout-utils';
import { toTimelineAsset } from '$lib/utils/timeline-util';
import { searchAssets, searchSmart } from '@immich/sdk';
import { isEqual } from 'lodash-es';

export class SearchResultsSegment extends PhotostreamSegment {
  #manager: SearchResultsManager;
  #identifier: SegmentIdentifier;
  #id: string;
  #searchTerms: SearchTerms;

  #viewerAssets: ViewerAsset[] = $state([]);

  constructor(manager: SearchResultsManager, searchTerms: SearchTerms) {
    super();
    this.#manager = manager;
    this.#searchTerms = searchTerms;
    this.#id = JSON.stringify(searchTerms);
    this.#identifier = {
      matches(segment: SearchResultsSegment) {
        return isEqual(segment.#searchTerms, searchTerms);
      },
    };
    this.initialCount = searchTerms.size || 100;
  }

  get timelineManager(): SearchResultsManager {
    return this.#manager;
  }

  get identifier(): SegmentIdentifier {
    return this.#identifier;
  }

  get id(): string {
    return this.#id;
  }

  async fetch(signal: AbortSignal): Promise<void> {
    const searchDto: SearchTerms = {
      ...this.#searchTerms,
      withExif: true,
      isVisible: true,
    };

    const { assets } =
      ('query' in searchDto || 'queryAssetId' in searchDto) && this.#manager.options.isSmartSearchEnabled
        ? await searchSmart({ smartSearchDto: searchDto }, { signal })
        : await searchAssets({ metadataSearchDto: searchDto }, { signal });
    this.#viewerAssets = assets.items.map((asset) => new ViewerAsset(this, toTimelineAsset(asset)));
  }

  layout(): void {
    const timelineAssets = this.#viewerAssets.map((viewerAsset) => viewerAsset.asset);
    const layoutOptions = this.timelineManager.createLayoutOptions();
    const geometry = getJustifiedLayoutFromAssets(timelineAssets, layoutOptions);
    this.height = timelineAssets.length === 0 ? 0 : geometry.containerHeight + this.timelineManager.headerHeight;
    for (let i = 0; i < this.#viewerAssets.length; i++) {
      const position = getPosition(geometry, i);
      this.#viewerAssets[i].position = position;
    }
  }

  get viewerAssets(): ViewerAsset[] {
    return this.#viewerAssets;
  }

  findAssetAbsolutePosition(assetId: string) {
    const viewerAsset = this.#viewerAssets.find((viewAsset) => viewAsset.id === assetId);
    if (viewerAsset) {
      if (!viewerAsset.position) {
        console.warn('No position for asset');
        return -1;
      }
      return this.top + viewerAsset.position.top + this.timelineManager.headerHeight;
    }
    return -1;
  }

  updateIntersection({ intersecting, actuallyIntersecting }: { intersecting: boolean; actuallyIntersecting: boolean }) {
    super.updateIntersection({ intersecting, actuallyIntersecting });
    // if we're the last month, try to load next month
    if (intersecting && this.timelineManager.months.at(-1) === this) {
      this.timelineManager.loadNextPage();
    }
  }
}
