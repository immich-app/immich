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

vitest.mock('@immich/ui', () => ({
  toastManager: {
    primary: vitest.fn(),
  },
}));

vitest.mock('$lib/utils/i18n', () => ({
  getFormatter: vitest.fn(),
  getPreferredLocale: vitest.fn(),
}));

vitest.mock('@immich/sdk');

vitest.mock('$lib/utils', async () => {
  const originalModule = await vitest.importActual('$lib/utils');
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

  describe('favorite actions', () => {
    beforeEach(() => {
      authManager.setPreferences(preferencesFactory.build());
      vitest.mocked(getFormatter).mockResolvedValue(vitest.fn().mockReturnValue('formatter'));
    });

    it('flips the heart as soon as the server has answered, rather than on a later round trip', async () => {
      // The icon is chosen by `$if: () => isOwner && asset.isFavorite`, and the handler used to
      // leave that field untouched — so the server was updated, the toast fired, the asset left the
      // Favorites view, and the filled heart stayed until something else replaced the object.
      const ownerId = 'owner';
      authManager.setUser(userAdminFactory.build({ id: ownerId }));
      const asset = assetFactory.build({ ownerId, isFavorite: true });
      vitest.mocked(updateAsset).mockResolvedValue({ ...asset, isFavorite: false });

      const assetActions = getAssetActions(() => '', asset);
      expect(assetActions.Unfavorite.$if?.()).toBe(true);

      await assetActions.Unfavorite.onAction?.();

      expect(asset.isFavorite).toBe(false);
      expect(assetActions.Unfavorite.$if?.()).toBe(false);
      expect(assetActions.Favorite.$if?.()).toBe(true);
    });

    it('flips the heart the other way when favoriting', async () => {
      const ownerId = 'owner';
      authManager.setUser(userAdminFactory.build({ id: ownerId }));
      const asset = assetFactory.build({ ownerId, isFavorite: false });
      vitest.mocked(updateAsset).mockResolvedValue({ ...asset, isFavorite: true });

      const assetActions = getAssetActions(() => '', asset);
      await assetActions.Favorite.onAction?.();

      expect(asset.isFavorite).toBe(true);
      expect(assetActions.Favorite.$if?.()).toBe(false);
    });

    it("takes the server's answer rather than assuming the toggle succeeded", async () => {
      // If the server declines the change, the icon must keep showing what the server holds. The
      // point of this fix is that the icon follows the response, not that it follows the click.
      const ownerId = 'owner';
      authManager.setUser(userAdminFactory.build({ id: ownerId }));
      const asset = assetFactory.build({ ownerId, isFavorite: true });
      vitest.mocked(updateAsset).mockResolvedValue({ ...asset, isFavorite: true });

      const assetActions = getAssetActions(() => '', asset);
      await assetActions.Unfavorite.onAction?.();

      expect(asset.isFavorite).toBe(true);
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
});
