import { getAssetActions, handleDownloadAsset, mergeRotation, normalizeAngle } from '$lib/services/asset.service';
import { user as userStore } from '$lib/stores/user.store';
import { setSharedLink } from '$lib/utils';
import { getFormatter } from '$lib/utils/i18n';
import { AssetEditAction, getAssetInfo, type AssetEditActionItemDto } from '@immich/sdk';
import { toastManager } from '@immich/ui';
import { assetFactory } from '@test-data/factories/asset-factory';
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

vitest.mock('$lib/managers/asset-viewer-manager.svelte', () => ({
  assetViewerManager: {
    setAsset: vitest.fn(),
  },
}));

vitest.mock('$lib/utils', async () => {
  const originalModule = await vitest.importActual('$lib/utils');
  return {
    ...originalModule,
    sleep: vitest.fn(),
  };
});

describe('AssetService', () => {
  describe('getAssetActions', () => {
    it('should allow shared link downloads if the user owns the asset and shared link downloads are disabled', () => {
      const ownerId = 'owner';
      const user = userAdminFactory.build({ id: ownerId });
      const asset = assetFactory.build({ ownerId });
      userStore.set(user);
      setSharedLink(sharedLinkFactory.build({ allowDownload: false }));
      const assetActions = getAssetActions(() => '', asset);
      expect(assetActions.SharedLinkDownload.$if?.()).toStrictEqual(true);
    });

    it('should not allow shared link downloads if the user does not own the asset and shared link downloads are disabled', () => {
      const ownerId = 'owner';
      const user = userAdminFactory.build({ id: 'non-owner' });
      const asset = assetFactory.build({ ownerId });
      userStore.set(user);
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

  describe('normalizeAngle', () => {
    it('should return 0 for 0', () => {
      expect(normalizeAngle(0)).toBe(0);
    });

    it('should return 90 for 90', () => {
      expect(normalizeAngle(90)).toBe(90);
    });

    it('should convert -90 to 270', () => {
      expect(normalizeAngle(-90)).toBe(270);
    });

    it('should convert 360 to 0', () => {
      expect(normalizeAngle(360)).toBe(0);
    });

    it('should convert 450 to 90', () => {
      expect(normalizeAngle(450)).toBe(90);
    });

    it('should convert -180 to 180', () => {
      expect(normalizeAngle(-180)).toBe(180);
    });
  });

  describe('mergeRotation', () => {
    it('should add rotation to empty edits', () => {
      const result = mergeRotation([], 90);
      expect(result).toEqual([{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }]);
    });

    it('should merge rotation with existing rotation', () => {
      const existing: AssetEditActionItemDto[] = [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }];
      const result = mergeRotation(existing, 90);
      expect(result).toEqual([{ action: AssetEditAction.Rotate, parameters: { angle: 180 } }]);
    });

    it('should remove rotation when merged angle is 0 (full circle)', () => {
      const existing: AssetEditActionItemDto[] = [{ action: AssetEditAction.Rotate, parameters: { angle: 270 } }];
      const result = mergeRotation(existing, 90);
      expect(result).toEqual([]);
    });

    it('should preserve other edit actions when merging', () => {
      const existing: AssetEditActionItemDto[] = [
        { action: AssetEditAction.Crop, parameters: { x: 0, y: 0, width: 100, height: 100 } },
        { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
      ];
      const result = mergeRotation(existing, 90);
      expect(result).toEqual([
        { action: AssetEditAction.Crop, parameters: { x: 0, y: 0, width: 100, height: 100 } },
        { action: AssetEditAction.Rotate, parameters: { angle: 180 } },
      ]);
    });

    it('should preserve other edit actions when rotation cancels out', () => {
      const existing: AssetEditActionItemDto[] = [
        { action: AssetEditAction.Crop, parameters: { x: 0, y: 0, width: 100, height: 100 } },
        { action: AssetEditAction.Rotate, parameters: { angle: 270 } },
      ];
      const result = mergeRotation(existing, 90);
      expect(result).toEqual([{ action: AssetEditAction.Crop, parameters: { x: 0, y: 0, width: 100, height: 100 } }]);
    });

    it('should handle rotate left (270 degrees)', () => {
      const result = mergeRotation([], 270);
      expect(result).toEqual([{ action: AssetEditAction.Rotate, parameters: { angle: 270 } }]);
    });

    it('should handle 180 degree rotation', () => {
      const result = mergeRotation([], 180);
      expect(result).toEqual([{ action: AssetEditAction.Rotate, parameters: { angle: 180 } }]);
    });

    it('should handle multiple successive rotations correctly', () => {
      let edits: AssetEditActionItemDto[] = [];
      edits = mergeRotation(edits, 90); // 90
      edits = mergeRotation(edits, 90); // 180
      edits = mergeRotation(edits, 90); // 270
      expect(edits).toEqual([{ action: AssetEditAction.Rotate, parameters: { angle: 270 } }]);
      edits = mergeRotation(edits, 90); // 360 -> 0 -> removed
      expect(edits).toEqual([]);
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
