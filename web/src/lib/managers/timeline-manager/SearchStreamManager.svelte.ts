import { PhotostreamManager } from '$lib/managers/timeline-manager/PhotostreamManager.svelte';
import { SearchStreamSegment } from '$lib/managers/timeline-manager/SearchStreamSegment.svelte';
import type { MetadataSearchDto, SmartSearchDto } from '@immich/sdk';

export type SearchTerms = MetadataSearchDto & Pick<SmartSearchDto, 'query' | 'queryAssetId'> & { isVisible: boolean };

export class SearchStreamManager extends PhotostreamManager {
  #isSmartSearchEnabled: boolean;

  #searchTerms: SearchTerms;
  #months: SearchStreamSegment[] = $state([]);

  constructor(searchTerms: SearchTerms, options: { isSmartSearchEnabled: boolean }) {
    super();
    this.#searchTerms = searchTerms;
    this.#isSmartSearchEnabled = options.isSmartSearchEnabled;
  }

  async init() {
    this.isInitialized = false;
    await this.initTask.execute(async () => {
      // add some months to start the searches
      for (let i = 1; i < 3; i++) {
        this.#months.push(new SearchStreamSegment(this, { ...this.#searchTerms, page: i }));
      }
    }, true);

    this.updateViewportGeometry(false);
  }

  get months(): SearchStreamSegment[] {
    return this.#months;
  }

  get isSmartSearchEnabled() {
    return this.#isSmartSearchEnabled;
  }

  loadNextPage() {
    debugger;
    // note: pages are 1-based
    this.#months.push(new SearchStreamSegment(this, { ...this.#searchTerms, page: this.#months.length + 1 }));
    this.updateViewportGeometry(false);
  }
}
