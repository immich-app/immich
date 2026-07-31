import { AssetJobName, AssetTypeEnum, getAssetInfo, runAssetJobs } from '@immich/sdk';
import { modalManager, toastManager } from '@immich/ui';
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
  modalManager: {
    showDialog: vitest.fn(),
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

  describe('handleRunAssetJob', () => {
    const $t = vitest.fn((key: string) => key);

    beforeEach(() => {
      vitest.mocked(getFormatter).mockResolvedValue($t as never);
    });

    afterEach(() => {
      vitest.mocked(modalManager.showDialog).mockReset();
      vitest.mocked(runAssetJobs).mockReset();
    });

    it('should confirm before re-transcribing a single asset, and skip the job if declined', async () => {
      vitest.mocked(modalManager.showDialog).mockResolvedValue(false);
      const asset = assetFactory.build({ type: AssetTypeEnum.Video });
      const action = getAssetActions(() => '', asset).RefreshTranscriptJob;

      await action.onAction(action);

      expect(modalManager.showDialog).toHaveBeenCalledWith({ prompt: 'confirm_reprocess_transcript' });
      expect(runAssetJobs).not.toHaveBeenCalled();
    });

    it('should re-transcribe a single asset once the confirmation is accepted', async () => {
      vitest.mocked(modalManager.showDialog).mockResolvedValue(true);
      const asset = assetFactory.build({ type: AssetTypeEnum.Video });
      const action = getAssetActions(() => '', asset).RefreshTranscriptJob;

      await action.onAction(action);

      expect(runAssetJobs).toHaveBeenCalledWith({
        assetJobsDto: { name: AssetJobName.RefreshTranscript, assetIds: [asset.id] },
      });
    });

    it('should not confirm before running an unrelated job', async () => {
      const asset = assetFactory.build();
      const action = getAssetActions(() => '', asset).RefreshFacesJob;

      await action.onAction(action);

      expect(modalManager.showDialog).not.toHaveBeenCalled();
      expect(runAssetJobs).toHaveBeenCalled();
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
