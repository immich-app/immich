import { AssetFileUploadResponseDto, LoginResponseDto } from '@immich/sdk';
import { readFile, writeFile } from 'node:fs/promises';
import { errorDto } from 'src/responses';
import { app, tempDir, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/download', () => {
  let admin: LoginResponseDto;
  let asset1: AssetFileUploadResponseDto;
  let asset2: AssetFileUploadResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    [asset1, asset2] = await Promise.all([utils.createAsset(admin.accessToken), utils.createAsset(admin.accessToken)]);
  });

  describe('POST /download/info', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app)
        .post(`/download/info`)
        .send({ assetIds: [asset1.id] });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

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
    it('should require authentication', async () => {
      const { status, body } = await request(app)
        .post(`/download/archive`)
        .send({ assetIds: [asset1.id, asset2.id] });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should download an archive', async () => {
      const { status, body } = await request(app)
        .post('/download/archive')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ assetIds: [asset1.id, asset2.id] });

      expect(status).toBe(200);
      expect(body instanceof Buffer).toBe(true);

      await writeFile(`${tempDir}/archive.zip`, body);
      await utils.unzip(`${tempDir}/archive.zip`, `${tempDir}/archive`);
      const files = [
        { filename: 'example.png', id: asset1.id },
        { filename: 'example+1.png', id: asset2.id },
      ];
      for (const { id, filename } of files) {
        const bytes = await readFile(`${tempDir}/archive/${filename}`);
        const asset = await utils.getAssetInfo(admin.accessToken, id);
        expect(utils.sha1(bytes)).toBe(asset.checksum);
      }
    });
  });

  describe('POST /download/asset/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post(`/download/asset/${asset1.id}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should download file', async () => {
      const response = await request(app)
        .post(`/download/asset/${asset1.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toEqual('image/png');
    });
  });
});
