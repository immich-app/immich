import { getAssetInfo, getAssetOcr, type AssetOcrResponseDto, type AssetResponseDto } from '@immich/sdk';

class AsyncCache<V> {
  #cache = new Map<string, V>();

  async getOrFetch<K>(
    params: K,
    fetcher: (params: K) => Promise<V>,
    keySerializer: (params: K) => string = (params) => JSON.stringify(params),
  ): Promise<V> {
    const cacheKey = keySerializer(params);

    const cached = this.#cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const value = await fetcher(params);
    if (value) {
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

  async getAsset(assetIdentifier: { key?: string; slug?: string; id: string }) {
    return this.#assetCache.getOrFetch(assetIdentifier, getAssetInfo);
  }

  async getAssetOcr(id: string) {
    return this.#ocrCache.getOrFetch({ id }, getAssetOcr, (params) => params.id);
  }

  clearAssetCache() {
    this.#assetCache.clear();
  }

  clearOcrCache() {
    this.#ocrCache.clear();
  }
}

export const assetCacheManager = new AssetCacheManager();
