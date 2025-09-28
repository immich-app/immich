import {
  PhotostreamSegment,
  type SegmentIdentifier,
} from '$lib/managers/photostream-manager/PhotostreamSegment.svelte';
import type {
  SearchResultsManager,
  SearchTerms,
} from '$lib/managers/searchresults-manager/SearchResultsManager.svelte';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { ViewerAsset } from '$lib/managers/timeline-manager/viewer-asset.svelte';
import { toTimelineAsset } from '$lib/utils/timeline-util';
import { TUNABLES } from '$lib/utils/tunables';
import { searchAssets, searchSmart } from '@immich/sdk';
import { isEqual } from 'lodash-es';
const {
  TIMELINE: { INTERSECTION_EXPAND_BOTTOM },
} = TUNABLES;
export class SearchResultsSegment extends PhotostreamSegment {
  #manager: SearchResultsManager;
  #identifier: SegmentIdentifier;
  #id: string;
  #searchTerms: SearchTerms;
  #currentPage: string | null = null;
  #nextPage: string | null = null;

  #viewerAssets: ViewerAsset[] = $state([]);

  constructor(manager: SearchResultsManager, currentPage: string, searchTerms: SearchTerms) {
    super();
    this.#currentPage = currentPage;
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

  async fetch(): Promise<void> {
    if (this.#currentPage === null) {
      return;
    }
    const searchDto: SearchTerms = {
      ...this.#searchTerms,
      withExif: true,
      isVisible: true,
      page: +this.#currentPage,
    };

    const { assets } =
      ('query' in searchDto || 'queryAssetId' in searchDto) && this.#manager.options.isSmartSearchEnabled
        ? await searchSmart({ smartSearchDto: searchDto })
        : await searchAssets({ metadataSearchDto: searchDto });
    this.#nextPage = assets.nextPage;

    this.#viewerAssets.push(...assets.items.map((asset) => new ViewerAsset(this, toTimelineAsset(asset))));
    this.layout();
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

  loadNextPage() {
    if (this.#nextPage !== null) {
      if (this.#currentPage === this.#nextPage) {
        // there's an active load
        return;
      }
      this.#currentPage = this.#nextPage;
      void this.reload(false);
    }
  }

  updateIntersection({ intersecting, actuallyIntersecting }: { intersecting: boolean; actuallyIntersecting: boolean }) {
    super.updateIntersection({ intersecting, actuallyIntersecting });
    const loadNextPage =
      this.timelineManager.timelineHeight - this.timelineManager.visibleWindow.bottom < INTERSECTION_EXPAND_BOTTOM;
    if (loadNextPage) {
      this.loadNextPage();
    }
  }

  addTimelineAsset(asset: TimelineAsset) {
    this.#viewerAssets.push(new ViewerAsset(this, asset));
    this.layout();
  }

  order(ids: string[]) {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const idMap = new Map(ids.map((id, index) => [id, index]));
    this.#viewerAssets.sort((a, b) => {
      const indexA = idMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const indexB = idMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return indexA - indexB;
    });
    this.layout();
  }
}
