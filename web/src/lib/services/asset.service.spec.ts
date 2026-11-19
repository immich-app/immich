import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { eventManager } from '#lib/managers/event-manager.svelte.ts';
import { queryClient } from '#lib/queries/client.ts';
import { getUserConfigQuery } from '#lib/queries/config-user.query.ts';
import { getAssetActions } from '#lib/services/asset.service.ts';
import { setSharedLink } from '#lib/utils.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { AssetTypeEnum } from '@immich/sdk';
import { modalManager, toastManager } from '@immich/ui';

test('offers still-image conversion only for owned uploaded JPEG motion photos', ({ data }) => {
  authManager.setUser(data.user);
  authManager.setPreferences(factory.preferences());
  queryClient.setQueryData(getUserConfigQuery().queryKey, data.userConfig);
  setSharedLink(undefined);

  const photo = factory.asset({ ownerId: data.user.id, livePhotoVideoId: crypto.randomUUID() });
  const available = (asset: typeof photo) => getAssetActions(() => '', asset).ConvertMotionPhoto.$if?.();

  expect(available(photo)).toBe(true);
  expect(available({ ...photo, originalPath: '/photos/photo.heic' })).toBe(false);
  expect(available({ ...photo, ownerId: crypto.randomUUID() })).toBe(false);
  expect(available({ ...photo, livePhotoVideoId: null })).toBe(false);
  expect(available({ ...photo, libraryId: crypto.randomUUID() })).toBe(false);
  expect(available({ ...photo, type: AssetTypeEnum.Video })).toBe(false);
});

test('confirms with Convert and shows success only after the motion photo is converted', async ({ data, api }) => {
  authManager.setUser(data.user);
  authManager.setPreferences(factory.preferences());
  queryClient.setQueryData(getUserConfigQuery().queryKey, data.userConfig);
  setSharedLink(undefined);

  const photo = factory.asset({ ownerId: data.user.id, livePhotoVideoId: crypto.randomUUID() });
  data.addAssets(photo);
  const confirm = vi.spyOn(modalManager, 'showDialog').mockResolvedValue(true as never);
  const success = vi.spyOn(toastManager, 'success');

  try {
    const action = getAssetActions(() => '', photo).ConvertMotionPhoto;
    await action.onAction?.({ action, event: new MouseEvent('click') });

    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ confirmText: 'convert' }));
    expect(api.getAssetInfo).toHaveBeenCalledWith({ params: { id: photo.id } });
    expect(api.runAssetJobs).toHaveBeenCalledWith({
      body: { name: 'convert-motion-photo', assetIds: [photo.id] },
    });
    expect(success).not.toHaveBeenCalled();

    eventManager.emit('AssetUpdate', factory.asset({ livePhotoVideoId: null }));
    eventManager.emit('AssetUpdate', photo);
    expect(success).not.toHaveBeenCalled();

    eventManager.emit('AssetUpdate', { ...photo, livePhotoVideoId: null });
    expect(success).toHaveBeenCalledWith('converted_motion_photos');
  } finally {
    confirm.mockRestore();
    success.mockRestore();
  }
});
