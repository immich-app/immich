import { getAssetInfo, updateAsset } from '@immich/sdk';
import { toastManager } from '@immich/ui';
import { vitest } from 'vitest';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { getAssetActions, handleDownloadAsset } from '$lib/services/asset.service';
import { setSharedLink } from '$lib/utils';
import { getFormatter } from '$lib/utils/i18n';
import { assetFactory } from '@test-data/factories/asset-factory';
import { preferencesFactory } from '@test-data/factories/preferences-factory';
import { sharedLinkFactory } from '@test-data/factories/shared-link-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';
import { handleFavorite, handleUnfavorite } from '$lib/services/asset.service';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { handleError } from '$lib/utils/handle-error'


vi.mock('@immich/ui', () => ({
  toastManager: {
    primary: vi.fn(),
  },
}));

vi.mock('$lib/utils/i18n', () => ({
  getFormatter: vi.fn(),
  getPreferredLocale: vi.fn(),
}));


vi.mock(import('@immich/sdk'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual, 
    updateAsset: vi.fn(),
    getAssetInfo: vi.fn(),
  };
});

vi.mock('$lib/utils', async () => {
  const originalModule = await vi.importActual('$lib/utils');
  return {
    ...originalModule,
    sleep: vitest.fn(),
  };
});

vi.mock(import('$lib/managers/feature-flags-manager.svelte'), function () {
  return {
    featureFlagsManager: { init: vi.fn(), loadFeatureFlags: vi.fn(), value: {} } as never,
  };
});

vi.mock('$lib/managers/event-manager.svelte');

vi.mock('$lib/utils/handle-error', () => ({
  handleError: vi.fn(),
}));

describe('AssetService', () => {
  describe('getAssetActions', () => {
    beforeEach(() => {
      authManager.setPreferences(preferencesFactory.build());
    });

    it('should allow shared link downloads if the user owns the asset and shared link downloads are disabled', () => {
      const ownerId = 'owner';
      const user = userAdminFactory.build({ id: ownerId });
      const asset = assetFactory.build({ ownerId });
      authManager.setUser(user);
      setSharedLink(sharedLinkFactory.build({ allowDownload: false }));
      const assetActions = getAssetActions(() => '', asset);
      expect(assetActions.SharedLinkDownload.$if?.()).toStrictEqual(true);
    });

    it('should not allow shared link downloads if the user does not own the asset and shared link downloads are disabled', () => {
      const ownerId = 'owner';
      const user = userAdminFactory.build({ id: 'non-owner' });
      const asset = assetFactory.build({ ownerId });
      authManager.setUser(user);
      setSharedLink(sharedLinkFactory.build({ allowDownload: false }));
      const assetActions = getAssetActions(() => '', asset);
      expect(assetActions.SharedLinkDownload.$if?.()).toStrictEqual(false);
    });

    it('should allow shared link downloads if shared link downloads are enabled regardless of user', () => {
      const asset = assetFactory.build();
      setSharedLink(sharedLinkFactory.build({ allowDownload: true }));
      const assetActions = getAssetActions(() => '', asset);
      expect(assetActions.SharedLinkDownload.$if?.()).toStrictEqual(true);
    });
  });

  describe('handleDownloadAsset', () => {
    it('should use the asset originalFileName when showing toasts', async () => {
      const $t = vitest.fn().mockReturnValue('formatter');
      vitest.mocked(getFormatter).mockResolvedValue($t);
      const asset = assetFactory.build({ originalFileName: 'asset.heic' });
      await handleDownloadAsset(asset, { edited: false });
      expect($t).toHaveBeenNthCalledWith(1, 'downloading_asset_filename', { values: { filename: 'asset.heic' } });
      expect(toastManager.primary).toHaveBeenCalledWith('formatter');
    });

    it('should use the motion asset originalFileName when showing toasts', async () => {
      const $t = vitest.fn().mockReturnValue('formatter');
      vitest.mocked(getFormatter).mockResolvedValue($t);
      const motionAsset = assetFactory.build({ originalFileName: 'asset.mov' });
      vitest.mocked(getAssetInfo).mockResolvedValue(motionAsset);
      const asset = assetFactory.build({ originalFileName: 'asset.heic', livePhotoVideoId: '1' });
      await handleDownloadAsset(asset, { edited: false });
      expect($t).toHaveBeenNthCalledWith(1, 'downloading_asset_filename', { values: { filename: 'asset.heic' } });
      expect($t).toHaveBeenNthCalledWith(2, 'downloading_asset_filename', { values: { filename: 'asset-motion.mov' } });
      expect(toastManager.primary).toHaveBeenCalledWith('formatter');
    });
  });

  describe('FavoriteAction', () => {
    beforeEach(() => {
      vitest.clearAllMocks();
    });

    it('should emit optimistic update and then server update on favorite success', async () => {
      const asset = assetFactory.build({ isFavorite: false });
      const serverResponse = { ...asset, isFavorite: true };

      const $t = vitest.fn().mockReturnValue('added_to_favorites');
      vitest.mocked(getFormatter).mockResolvedValue($t);
      vitest.mocked(updateAsset).mockResolvedValue(serverResponse);

      await handleFavorite(asset);

      expect(eventManager.emit).toHaveBeenNthCalledWith(
        1,
        'AssetUpdate',
        { ...asset, isFavorite: true },
      );

      expect(eventManager.emit).toHaveBeenNthCalledWith(
        2,
        'AssetUpdate',
        serverResponse,
      );

      expect(toastManager.primary).toHaveBeenCalledWith('added_to_favorites');
    });

    it('should revert optimistic update on favorite failure', async () => {
      const asset = assetFactory.build({ isFavorite: false });

      const $t = vitest.fn().mockReturnValue('error');
      vitest.mocked(getFormatter).mockResolvedValue($t);
      vitest.mocked(updateAsset).mockRejectedValue(new Error('fail'));

      await handleFavorite(asset);

      expect(eventManager.emit).toHaveBeenNthCalledWith(
        1,
        'AssetUpdate',
        { ...asset, isFavorite: true },
      );

      expect(eventManager.emit).toHaveBeenNthCalledWith(
        2,
        'AssetUpdate',
        asset,
      );

      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'error',
      );
    });

    it('should emit optimistic update and then server update on unfavorite success', async () => {
      const asset = assetFactory.build({ isFavorite: true });
      const serverResponse = { ...asset, isFavorite: false };

      const $t = vitest.fn().mockReturnValue('removed_to_favorites');
      vitest.mocked(getFormatter).mockResolvedValue($t);
      vitest.mocked(updateAsset).mockResolvedValue(serverResponse);

      await handleUnfavorite(asset);

      expect(eventManager.emit).toHaveBeenNthCalledWith(
        1,
        'AssetUpdate',
        { ...asset, isFavorite: false },
      );

      expect(eventManager.emit).toHaveBeenNthCalledWith(
        2,
        'AssetUpdate',
        serverResponse,
      );

      expect(toastManager.primary).toHaveBeenCalledWith('removed_to_favorites');
    });

    it('should revert optimistic update on unfavorite failure', async () => {
      const asset = assetFactory.build({ isFavorite: true });

      const $t = vitest.fn().mockReturnValue('error');
      vitest.mocked(getFormatter).mockResolvedValue($t);
      vitest.mocked(updateAsset).mockRejectedValue(new Error('fail'));

      await handleUnfavorite(asset);

      expect(eventManager.emit).toHaveBeenNthCalledWith(
        1,
        'AssetUpdate',
        { ...asset, isFavorite: false },
      );

      expect(eventManager.emit).toHaveBeenNthCalledWith(
        2,
        'AssetUpdate',
        asset,
      );

      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'error',
      );
    });
  });
});
