import { deleteAssets, getAuditFiles, updateAsset, type LoginResponseDto } from '@immich/sdk';
import { asBearerAuth, utils } from 'src/utils';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/audit', () => {
  let admin: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    await utils.resetFilesystem();

    admin = await utils.adminSetup();
  });

  // TODO: Enable these tests again once #7436 is resolved as these were flaky
  describe.skip('GET :/file-report', () => {
    it('excludes assets without issues from report', async () => {
      const [trashedAsset, archivedAsset] = await Promise.all([
        utils.createAsset(admin.accessToken),
        utils.createAsset(admin.accessToken),
        utils.createAsset(admin.accessToken),
      ]);

      await Promise.all([
        deleteAssets({ assetBulkDeleteDto: { ids: [trashedAsset.id] } }, { headers: asBearerAuth(admin.accessToken) }),
        updateAsset(
          {
            id: archivedAsset.id,
            updateAssetDto: { isArchived: true },
          },
          { headers: asBearerAuth(admin.accessToken) },
        ),
      ]);

      const body = await getAuditFiles({
        headers: asBearerAuth(admin.accessToken),
      });

      expect(body.orphans).toHaveLength(0);
      expect(body.extras).toHaveLength(0);
    });
  });
});
