import { deleteAssets, getAuditFiles, updateAsset, type LoginResponseDto } from '@immich/sdk';
import { apiUtils, asBearerAuth, dbUtils, fileUtils } from 'src/utils';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/audit', () => {
  let admin: LoginResponseDto;

  beforeAll(async () => {
    apiUtils.setup();
    await dbUtils.reset();
    await fileUtils.reset();

    admin = await apiUtils.adminSetup();
  });

  describe('GET :/file-report', () => {
    it('excludes assets without issues from report', async () => {
      const [trashedAsset, archivedAsset] = await Promise.all([
        apiUtils.createAsset(admin.accessToken),
        apiUtils.createAsset(admin.accessToken),
        apiUtils.createAsset(admin.accessToken),
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
