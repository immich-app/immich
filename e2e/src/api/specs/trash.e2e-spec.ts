import { LoginResponseDto, getAssetInfo, getAssetStatistics, scanLibrary } from '@immich/sdk';
import { existsSync } from 'node:fs';
import { Socket } from 'socket.io-client';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, testAssetDir, testAssetDirInternal, utils } from 'src/utils';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const scan = async (accessToken: string, id: string) => scanLibrary({ id }, { headers: asBearerAuth(accessToken) });

describe('/trash', () => {
  let admin: LoginResponseDto;
  let ws: Socket;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup({ onboarding: false });
    ws = await utils.connectWebsocket(admin.accessToken);
  });

  afterAll(() => {
    utils.disconnectWebsocket(ws);
  });

  describe('POST /trash/empty', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post('/trash/empty');

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should empty the trash', async () => {
      const { id: assetId } = await utils.createAsset(admin.accessToken);
      await utils.deleteAssets(admin.accessToken, [assetId]);

      const before = await getAssetInfo({ id: assetId }, { headers: asBearerAuth(admin.accessToken) });
      expect(before).toStrictEqual(expect.objectContaining({ id: assetId, isTrashed: true }));

      const { status, body } = await request(app)
        .post('/trash/empty')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual({ count: 1 });

      await utils.waitForWebsocketEvent({ event: 'assetDelete', id: assetId });

      const after = await getAssetStatistics({ isTrashed: true }, { headers: asBearerAuth(admin.accessToken) });
      expect(after.total).toBe(0);

      expect(existsSync(before.originalPath)).toBe(false);
    });

    it('should empty the trash with archived assets', async () => {
      const { id: assetId } = await utils.createAsset(admin.accessToken);
      await utils.archiveAssets(admin.accessToken, [assetId]);
      await utils.deleteAssets(admin.accessToken, [assetId]);

      const before = await getAssetInfo({ id: assetId }, { headers: asBearerAuth(admin.accessToken) });
      expect(before).toStrictEqual(expect.objectContaining({ id: assetId, isTrashed: true, isArchived: true }));

      const { status, body } = await request(app)
        .post('/trash/empty')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual({ count: 1 });

      await utils.waitForWebsocketEvent({ event: 'assetDelete', id: assetId });

      const after = await getAssetStatistics({ isTrashed: true }, { headers: asBearerAuth(admin.accessToken) });
      expect(after.total).toBe(0);

      expect(existsSync(before.originalPath)).toBe(false);
    });

    it('should not delete offline-trashed assets from disk', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp/offline`],
      });

      utils.createImageFile(`${testAssetDir}/temp/offline/offline.png`);

      await scan(admin.accessToken, library.id);
      await utils.waitForQueueFinish(admin.accessToken, 'library');

      const { assets } = await utils.metadataSearch(admin.accessToken, { libraryId: library.id });
      expect(assets.items.length).toBe(1);
      const asset = assets.items[0];

      utils.removeImageFile(`${testAssetDir}/temp/offline/offline.png`);

      await scan(admin.accessToken, library.id);
      await utils.waitForQueueFinish(admin.accessToken, 'library');

      const assetBefore = await utils.getAssetInfo(admin.accessToken, asset.id);
      expect(assetBefore).toMatchObject({ isTrashed: true, isOffline: true });

      utils.createImageFile(`${testAssetDir}/temp/offline/offline.png`);

      const { status } = await request(app).post('/trash/empty').set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);

      await utils.waitForQueueFinish(admin.accessToken, 'backgroundTask');

      const assetAfter = await utils.getAssetInfo(admin.accessToken, asset.id);
      expect(assetAfter).toMatchObject({ isTrashed: true, isOffline: true });

      expect(existsSync(`${testAssetDir}/temp/offline/offline.png`)).toBe(true);

      utils.removeImageFile(`${testAssetDir}/temp/offline/offline.png`);
    });
  });

  describe('POST /trash/restore', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post('/trash/restore');

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should restore all trashed assets', async () => {
      const { id: assetId } = await utils.createAsset(admin.accessToken);
      await utils.deleteAssets(admin.accessToken, [assetId]);

      const before = await getAssetInfo({ id: assetId }, { headers: asBearerAuth(admin.accessToken) });
      expect(before).toStrictEqual(expect.objectContaining({ id: assetId, isTrashed: true }));

      const { status, body } = await request(app)
        .post('/trash/restore')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual({ count: 1 });

      const after = await getAssetInfo({ id: assetId }, { headers: asBearerAuth(admin.accessToken) });
      expect(after).toStrictEqual(expect.objectContaining({ id: assetId, isTrashed: false }));
    });

    it('should not restore offline-trashed assets', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp/offline`],
      });

      utils.createImageFile(`${testAssetDir}/temp/offline/offline.png`);

      await scan(admin.accessToken, library.id);
      await utils.waitForQueueFinish(admin.accessToken, 'library');

      const { assets } = await utils.metadataSearch(admin.accessToken, { libraryId: library.id });
      expect(assets.count).toBe(1);
      const assetId = assets.items[0].id;

      utils.removeImageFile(`${testAssetDir}/temp/offline/offline.png`);

      await scan(admin.accessToken, library.id);

      await utils.waitForQueueFinish(admin.accessToken, 'library');

      const before = await getAssetInfo({ id: assetId }, { headers: asBearerAuth(admin.accessToken) });
      expect(before).toStrictEqual(expect.objectContaining({ id: assetId, isOffline: true }));

      const { status } = await request(app).post('/trash/restore').set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);

      const after = await getAssetInfo({ id: assetId }, { headers: asBearerAuth(admin.accessToken) });
      expect(after).toStrictEqual(expect.objectContaining({ id: assetId, isOffline: true }));
    });
  });

  describe('POST /trash/restore/assets', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post('/trash/restore/assets');

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should restore a trashed asset by id', async () => {
      const { id: assetId } = await utils.createAsset(admin.accessToken);
      await utils.deleteAssets(admin.accessToken, [assetId]);

      const before = await utils.getAssetInfo(admin.accessToken, assetId);
      expect(before.isTrashed).toBe(true);

      const { status, body } = await request(app)
        .post('/trash/restore/assets')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ ids: [assetId] });
      expect(status).toBe(200);
      expect(body).toEqual({ count: 1 });

      const after = await utils.getAssetInfo(admin.accessToken, assetId);
      expect(after.isTrashed).toBe(false);
    });

    it('should not restore an offline-trashed asset', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp/offline`],
      });

      utils.createImageFile(`${testAssetDir}/temp/offline/offline.png`);

      await scan(admin.accessToken, library.id);
      await utils.waitForQueueFinish(admin.accessToken, 'library');

      const { assets } = await utils.metadataSearch(admin.accessToken, { libraryId: library.id });
      expect(assets.count).toBe(1);
      const assetId = assets.items[0].id;

      utils.removeImageFile(`${testAssetDir}/temp/offline/offline.png`);

      await scan(admin.accessToken, library.id);
      await utils.waitForQueueFinish(admin.accessToken, 'library');

      const before = await utils.getAssetInfo(admin.accessToken, assetId);
      expect(before.isTrashed).toBe(true);

      const { status } = await request(app)
        .post('/trash/restore/assets')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ ids: [assetId] });
      expect(status).toBe(200);

      const after = await utils.getAssetInfo(admin.accessToken, assetId);
      expect(after.isTrashed).toBe(true);
    });
  });
});
