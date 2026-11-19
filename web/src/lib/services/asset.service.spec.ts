import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { queryClient } from '#lib/queries/client.ts';
import { getUserConfigQuery } from '#lib/queries/config-user.query.ts';
import { getAssetActions } from '#lib/services/asset.service.ts';
import { setSharedLink } from '#lib/utils.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { AssetTypeEnum } from '@immich/sdk';

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
