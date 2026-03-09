import { imageManager } from '$lib/managers/ImageManager.svelte';
import { getAssetMediaUrl } from '$lib/utils';
import { cancelImageUrl } from '$lib/utils/sw-messaging';
import { AssetMediaSize } from '@immich/sdk';
import { assetFactory } from '@test-data/factories/asset-factory';

vi.mock('$lib/utils/sw-messaging', () => ({
  cancelImageUrl: vi.fn(),
}));

vi.mock('$lib/utils', () => ({
  getAssetMediaUrl: vi.fn(),
}));

describe('ImageManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('preload', () => {
    it('creates an Image with the correct URL', () => {
      vi.mocked(getAssetMediaUrl).mockReturnValue('/api/assets/123/media');
      const asset = assetFactory.build();

      imageManager.preload(asset);

      expect(getAssetMediaUrl).toHaveBeenCalledWith({
        id: asset.id,
        size: AssetMediaSize.Preview,
        cacheKey: asset.thumbhash,
      });
    });

    it('does nothing for undefined asset', () => {
      imageManager.preload(undefined);
      expect(getAssetMediaUrl).not.toHaveBeenCalled();
    });

    it('does nothing when getAssetMediaUrl returns falsy', () => {
      vi.mocked(getAssetMediaUrl).mockReturnValue('');
      const asset = assetFactory.build();

      imageManager.preload(asset);

      expect(getAssetMediaUrl).toHaveBeenCalled();
    });

    it('uses the specified size', () => {
      vi.mocked(getAssetMediaUrl).mockReturnValue('/api/assets/123/media');
      const asset = assetFactory.build();

      imageManager.preload(asset, AssetMediaSize.Thumbnail);

      expect(getAssetMediaUrl).toHaveBeenCalledWith({
        id: asset.id,
        size: AssetMediaSize.Thumbnail,
        cacheKey: asset.thumbhash,
      });
    });
  });

  describe('cancel', () => {
    it('calls cancelImageUrl with the correct URL', () => {
      vi.mocked(getAssetMediaUrl).mockReturnValue('/api/assets/123/media');
      const asset = assetFactory.build();

      imageManager.cancel(asset, AssetMediaSize.Preview);

      expect(cancelImageUrl).toHaveBeenCalledWith('/api/assets/123/media');
    });

    it('does nothing for undefined asset', () => {
      imageManager.cancel(undefined);
      expect(getAssetMediaUrl).not.toHaveBeenCalled();
      expect(cancelImageUrl).not.toHaveBeenCalled();
    });

    it('cancels all sizes when size is "all"', () => {
      vi.mocked(getAssetMediaUrl).mockImplementation(({ size }) => `/api/assets/123/${size}`);
      const asset = assetFactory.build();

      imageManager.cancel(asset, 'all');

      expect(getAssetMediaUrl).toHaveBeenCalledTimes(Object.values(AssetMediaSize).length);
      for (const size of Object.values(AssetMediaSize)) {
        expect(cancelImageUrl).toHaveBeenCalledWith(`/api/assets/123/${size}`);
      }
    });

    it('does not call cancelImageUrl when URL is falsy', () => {
      vi.mocked(getAssetMediaUrl).mockReturnValue('');
      const asset = assetFactory.build();

      imageManager.cancel(asset, AssetMediaSize.Preview);

      expect(cancelImageUrl).not.toHaveBeenCalled();
    });
  });
});
