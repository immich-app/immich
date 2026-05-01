import { assetCacheManager } from '$lib/managers/AssetCacheManager.svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAssetInfoFromParam } from './navigation';

vi.mock('$app/navigation', () => ({
  goto: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('$app/stores', () => ({
  page: {
    subscribe: vi.fn(),
  },
}));

vi.mock('$lib/managers/AssetCacheManager.svelte', () => ({
  assetCacheManager: {
    getAsset: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('getAssetInfoFromParam', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('passes spaceId through when preloading an asset from a space route', async () => {
    await getAssetInfoFromParam({ assetId: 'asset-1', spaceId: 'space-1' });

    expect(assetCacheManager.getAsset).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'asset-1', spaceId: 'space-1' }),
      false,
    );
  });

  it('does not fetch when assetId is absent', () => {
    const result = getAssetInfoFromParam({ spaceId: 'space-1' });

    expect(result).toBeUndefined();
    expect(assetCacheManager.getAsset).not.toHaveBeenCalled();
  });
});
