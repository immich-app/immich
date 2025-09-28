import { PhotostreamManager } from '$lib/managers/photostream-manager/PhotostreamManager.svelte';
import { SearchResultsSegment } from '$lib/managers/searchresults-manager/SearchResultsSegment.svelte';
import type { MetadataSearchDto, SmartSearchDto } from '@immich/sdk';
import { isEqual } from 'lodash-es';

export type SearchTerms = MetadataSearchDto & Pick<SmartSearchDto, 'query' | 'queryAssetId'> & { isVisible: boolean };

export type Options = {
  searchTerms: SearchTerms;
  isSmartSearchEnabled: boolean;
};

export class SearchResultsManager extends PhotostreamManager {
  #options: Options = {
    searchTerms: {
      isVisible: false,
    },
    isSmartSearchEnabled: false,
  };

  #months: SearchResultsSegment[] = $state([]);

  get options() {
    return this.#options;
  }

  async updateOptions(options: Options) {
    if (isEqual(this.#options, options)) {
      return;
    }
    await this.initTask.reset();
    this.#options = options;
    await this.init();
    this.updateViewportGeometry(false);
  }

  async init() {
    this.isInitialized = false;
    await this.initTask.execute(() => {
      this.#months.splice(0);
      this.#months.push(new SearchResultsSegment(this, '1', { ...this.#options.searchTerms }));
      return Promise.resolve();
    }, true);

    this.updateViewportGeometry(false);
  }

  get months(): SearchResultsSegment[] {
    return this.#months;
  }

  findNextAsset(currentAssetId: string): { id: string } | undefined {
    for (let segmentIndex = 0; segmentIndex < this.#months.length; segmentIndex++) {
      const segment = this.#months[segmentIndex];
      const assetIndex = segment.assets.findIndex((asset) => asset.id === currentAssetId);

      if (assetIndex !== -1) {
        // Found the current asset
        if (assetIndex < segment.assets.length - 1) {
          // Next asset is in the same segment
          return segment.assets[assetIndex + 1];
        } else if (segmentIndex < this.#months.length - 1) {
          // Next asset is in the next segment
          const nextSegment = this.#months[segmentIndex + 1];
          if (nextSegment.assets.length > 0) {
            return nextSegment.assets[0];
          }
        }
        break;
      }
    }
    return undefined;
  }

  findPreviousAsset(currentAssetId: string): { id: string } | undefined {
    for (let segmentIndex = 0; segmentIndex < this.#months.length; segmentIndex++) {
      const segment = this.#months[segmentIndex];
      const assetIndex = segment.assets.findIndex((asset) => asset.id === currentAssetId);

      if (assetIndex !== -1) {
        // Found the current asset
        if (assetIndex > 0) {
          // Previous asset is in the same segment
          return segment.assets[assetIndex - 1];
        } else if (segmentIndex > 0) {
          // Previous asset is in the previous segment
          const previousSegment = this.#months[segmentIndex - 1];
          if (previousSegment.assets.length > 0) {
            return previousSegment.assets.at(-1);
          }
        }
        break;
      }
    }
    return undefined;
  }

  findRandomAsset(): { id: string } | undefined {
    // Get all loaded assets across all segments
    const allAssets = this.#months.flatMap((segment) => segment.assets);

    if (allAssets.length === 0) {
      return undefined;
    }

    // Return a random asset
    const randomIndex = Math.floor(Math.random() * allAssets.length);
    return allAssets[randomIndex];
  }
}
