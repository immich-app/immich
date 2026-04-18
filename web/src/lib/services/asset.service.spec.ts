import { authManager } from '$lib/managers/auth-manager.svelte';
import { getAssetActions, handleDownloadAsset, handleDownloadAssetAsJpeg } from '$lib/services/asset.service';
import { setSharedLink } from '$lib/utils';
import { getFormatter } from '$lib/utils/i18n';
import { AssetTypeEnum, getAssetInfo } from '@immich/sdk';
import { toastManager } from '@immich/ui';
import { assetFactory } from '@test-data/factories/asset-factory';
import { preferencesFactory } from '@test-data/factories/preferences-factory';
import { sharedLinkFactory } from '@test-data/factories/shared-link-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';
import { vitest } from 'vitest';

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
    downloadRequest: vitest.fn().mockResolvedValue({ data: new Blob(), status: 200 }),
  };
});

vitest.mock('$lib/utils/asset-utils', () => ({
  downloadBlob: vitest.fn(),
  downloadUrl: vitest.fn(),
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

    it('should show DownloadAsJpeg for authenticated users with image assets', () => {
      const user = userAdminFactory.build();
      const asset = assetFactory.build({ type: AssetTypeEnum.Image, duration: '0:00:00.00000' });
      authManager.setUser(user);
      const assetActions = getAssetActions(() => '', asset);
      expect(assetActions.DownloadAsJpeg.$if?.()).toStrictEqual(true);
    });

    it('should not show DownloadAsJpeg for unauthenticated users', () => {
      const asset = assetFactory.build({ type: AssetTypeEnum.Image, duration: '0:00:00.00000' });
      const assetActions = getAssetActions(() => '', asset);
      expect(assetActions.DownloadAsJpeg.$if?.()).toStrictEqual(false);
    });

    it('should not show DownloadAsJpeg for video assets', () => {
      const user = userAdminFactory.build();
      const asset = assetFactory.build({ type: AssetTypeEnum.Video });
      authManager.setUser(user);
      const assetActions = getAssetActions(() => '', asset);
      expect(assetActions.DownloadAsJpeg.$if?.()).toStrictEqual(false);
    });

    it('should show DownloadAsJpeg for static GIFs', () => {
      const user = userAdminFactory.build();
      const asset = assetFactory.build({
        type: AssetTypeEnum.Image,
        originalFileName: 'image.gif',
        duration: '0:00:00.00000',
      });
      authManager.setUser(user);
      const assetActions = getAssetActions(() => '', asset);
      expect(assetActions.DownloadAsJpeg.$if?.()).toStrictEqual(true);
    });

    it('should not show DownloadAsJpeg for animated GIFs', () => {
      const user = userAdminFactory.build();
      const asset = assetFactory.build({
        type: AssetTypeEnum.Image,
        originalFileName: 'animated.gif',
        duration: '00:00:02.500',
      });
      authManager.setUser(user);
      const assetActions = getAssetActions(() => '', asset);
      expect(assetActions.DownloadAsJpeg.$if?.()).toStrictEqual(false);
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

  describe('handleDownloadAssetAsJpeg', () => {
    it('should replace file extension with .jpg for HEIC files', async () => {
      const $t = vitest.fn().mockReturnValue('formatter');
      vitest.mocked(getFormatter).mockResolvedValue($t);
      const asset = assetFactory.build({ originalFileName: 'photo.heic' });
      await handleDownloadAssetAsJpeg(asset);
      expect($t).toHaveBeenCalledWith('downloading_asset_filename', { values: { filename: 'photo.jpg' } });
      expect(toastManager.primary).toHaveBeenCalledWith('formatter');
    });

    it('should replace file extension with .jpg for RAW files', async () => {
      const $t = vitest.fn().mockReturnValue('formatter');
      vitest.mocked(getFormatter).mockResolvedValue($t);
      const asset = assetFactory.build({ originalFileName: 'IMG_1234.CR2' });
      await handleDownloadAssetAsJpeg(asset);
      expect($t).toHaveBeenCalledWith('downloading_asset_filename', { values: { filename: 'IMG_1234.jpg' } });
      expect(toastManager.primary).toHaveBeenCalledWith('formatter');
    });
  });
});
