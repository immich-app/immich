import { getAssetInfo, getAssetOcr, type AssetOcrResponseDto, type AssetResponseDto } from '@immich/sdk';

const defaultSerializer = <K>(params: K) => JSON.stringify(params);

class AsyncCache<V> {
  #cache = new Map<string, V>();

  async getOrFetch<K>(
    params: K,
    fetcher: (params: K) => Promise<V>,
    keySerializer: (params: K) => string = defaultSerializer,
    updateCache: boolean,
  ): Promise<V> {
    const cacheKey = keySerializer(params);

    const cached = this.#cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const value = await fetcher(params);
    if (value && updateCache) {
      this.#cache.set(cacheKey, value);
    }

    return value;
  }

  clear() {
    this.#cache.clear();
  }
}

class AssetCacheManager {
  #assetCache = new AsyncCache<AssetResponseDto>();
  #ocrCache = new AsyncCache<AssetOcrResponseDto[]>();

  async getAsset(assetIdentifier: { key?: string; slug?: string; id: string }, updateCache = true) {
    return this.#assetCache.getOrFetch(assetIdentifier, getAssetInfo, defaultSerializer, updateCache);
  }

  async getAssetOcr(id: string) {
    return this.#ocrCache.getOrFetch({ id }, getAssetOcr, (params) => params.id, true);
  }

  clearAssetCache() {
    this.#assetCache.clear();
  }

  clearOcrCache() {
    this.#ocrCache.clear();
  }

  invalidate() {
    this.clearAssetCache();
    this.clearOcrCache();
  }
}

export const assetCacheManager = new AssetCacheManager();
