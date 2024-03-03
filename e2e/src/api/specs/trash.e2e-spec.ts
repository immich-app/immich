import { LoginResponseDto, getAllAssets } from '@immich/sdk';
import { Socket } from 'socket.io-client';
import { errorDto } from 'src/responses';
import { apiUtils, app, asBearerAuth, dbUtils, wsUtils } from 'src/utils';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('/trash', () => {
  let admin: LoginResponseDto;
  let ws: Socket;

  beforeAll(async () => {
    apiUtils.setup();
    await dbUtils.reset();
    admin = await apiUtils.adminSetup({ onboarding: false });
    ws = await wsUtils.connect(admin.accessToken);
  });

  afterAll(() => {
    wsUtils.disconnect(ws);
  });

  describe('POST /trash/empty', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post('/trash/empty');

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should empty the trash', async () => {
      const { id: assetId } = await apiUtils.createAsset(admin.accessToken);
      await apiUtils.deleteAssets(admin.accessToken, [assetId]);

      const before = await getAllAssets({}, { headers: asBearerAuth(admin.accessToken) });

      expect(before.length).toBeGreaterThanOrEqual(1);

      const { status } = await request(app).post('/trash/empty').set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(204);

      await wsUtils.waitForEvent({ event: 'delete', assetId });

      const after = await getAllAssets({}, { headers: asBearerAuth(admin.accessToken) });
      expect(after.length).toBe(0);
    });
  });

  describe('POST /trash/restore', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post('/trash/restore');

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should restore all trashed assets', async () => {
      const { id: assetId } = await apiUtils.createAsset(admin.accessToken);
      await apiUtils.deleteAssets(admin.accessToken, [assetId]);

      const before = await apiUtils.getAssetInfo(admin.accessToken, assetId);
      expect(before.isTrashed).toBe(true);

      const { status } = await request(app).post('/trash/restore').set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(204);

      const after = await apiUtils.getAssetInfo(admin.accessToken, assetId);
      expect(after.isTrashed).toBe(false);
    });
  });

  describe('POST /trash/restore/assets', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post('/trash/restore/assets');

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should restore a trashed asset by id', async () => {
      const { id: assetId } = await apiUtils.createAsset(admin.accessToken);
      await apiUtils.deleteAssets(admin.accessToken, [assetId]);

      const before = await apiUtils.getAssetInfo(admin.accessToken, assetId);
      expect(before.isTrashed).toBe(true);

      const { status } = await request(app)
        .post('/trash/restore/assets')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ ids: [assetId] });
      expect(status).toBe(204);

      const after = await apiUtils.getAssetInfo(admin.accessToken, assetId);
      expect(after.isTrashed).toBe(false);
    });
  });
});
