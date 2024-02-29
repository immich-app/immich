import { AssetFileUploadResponseDto, LoginResponseDto } from '@immich/sdk';
import { errorDto } from 'src/responses';
import { apiUtils, app, dbUtils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/download', () => {
  let admin: LoginResponseDto;
  let asset1: AssetFileUploadResponseDto;

  beforeAll(async () => {
    apiUtils.setup();
    await dbUtils.reset();
    admin = await apiUtils.adminSetup();
    asset1 = await apiUtils.createAsset(admin.accessToken);
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
