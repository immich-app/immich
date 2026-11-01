import { getActivitiesQuery } from '#lib/queries/activity.query.ts';
import { getAlbumsByAssetQuery } from '#lib/queries/album.query.ts';
import { unlockAuthSessionMutation } from '#lib/queries/auth.query.ts';
import { executeMutation, queryClient } from '#lib/queries/client.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { expect } from 'vitest';

test('unlocking refreshes album membership and activity results cached while locked', async ({ api, data }) => {
  const album = factory.album();
  const asset = factory.asset();
  const activity = factory.activity({ user: factory.user(), assetId: asset.id });
  api.on({
    getAllAlbums: () => ({ json: data.getAuthStatus().isElevated ? [album] : [] }),
    getActivities: () => ({ json: data.getAuthStatus().isElevated ? [activity] : [] }),
  });
  const albums = getAlbumsByAssetQuery(asset.id);
  const activities = getActivitiesQuery({ albumId: album.id });
  expect(await queryClient.query(albums)).toEqual([]);
  expect(await queryClient.query(activities)).toEqual([]);

  await executeMutation(unlockAuthSessionMutation, [{ sessionUnlockDto: { pinCode: '123456' } }]);

  expect(await queryClient.query(albums)).toEqual([album]);
  expect(await queryClient.query(activities)).toEqual([activity]);
  expect(api.unlockAuthSession).toHaveBeenCalledWith({ body: { pinCode: '123456' } });
});
