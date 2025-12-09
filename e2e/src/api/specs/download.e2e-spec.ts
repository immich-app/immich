import { AssetMediaResponseDto, LoginResponseDto } from '@immich/sdk';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { app, tempDir, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/download', () => {
  let admin: LoginResponseDto;
  let asset1: AssetMediaResponseDto;
  let asset2: AssetMediaResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    [asset1, asset2] = await Promise.all([utils.createAsset(admin.accessToken), utils.createAsset(admin.accessToken)]);
  });

  describe('POST /download/info', () => {
    it('should download info', async () => {
      const { status, body } = await request(app)
        .post('/download/info')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ assetIds: [asset1.id] });

      expect(status).toBe(201);
      expect(body).toEqual(
        expect.objectContaining({
          archives: [expect.objectContaining({ assetIds: [asset1.id] })],
        }),
      );
    });
  });

  describe('POST /download/archive', () => {
    it('should download an archive', async () => {
      const { status, body } = await request(app)
        .post('/download/archive')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ assetIds: [asset1.id, asset2.id] });

      expect(status).toBe(200);
      expect(body instanceof Buffer).toBe(true);

      await writeFile(`${tempDir}/archive.zip`, body);
      await utils.unzip(`${tempDir}/archive.zip`, `${tempDir}/archive`);
      const files = [{ id: asset1.id }, { id: asset2.id }];
      for (const { id } of files) {
        const asset = await utils.getAssetInfo(admin.accessToken, id);
        const bytes = await readFile(`${tempDir}/archive/${path.basename(asset.originalPath)}`);

        expect(utils.sha1(bytes)).toBe(asset.checksum);
      }
    });
  });
});
