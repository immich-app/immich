import { LibraryResponseDto, LoginResponseDto, getAllLibraries } from '@immich/sdk';
import { cpSync, existsSync } from 'node:fs';
import { Socket } from 'socket.io-client';
import { app, asBearerAuth, testAssetDir, testAssetDirInternal, utils } from 'src/utils';
import request from 'supertest';
import { utimes } from 'utimes';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('/libraries', () => {
  let admin: LoginResponseDto;
  let library: LibraryResponseDto;
  let websocket: Socket;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    await utils.resetAdminConfig(admin.accessToken);
    library = await utils.createLibrary(admin.accessToken, { ownerId: admin.userId });
    websocket = await utils.connectWebsocket(admin.accessToken);
    utils.createImageFile(`${testAssetDir}/temp/directoryA/assetA.png`);
    utils.createImageFile(`${testAssetDir}/temp/directoryB/assetB.png`);
  });

  afterAll(() => {
    utils.disconnectWebsocket(websocket);
    utils.resetTempFolder();
  });

  beforeEach(() => {
    utils.resetEvents();
  });

  describe('POST /libraries', () => {
    it('should create an external library with defaults', async () => {
      const { status, body } = await request(app)
        .post('/libraries')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ ownerId: admin.userId });

      expect(status).toBe(201);
      expect(body).toEqual(
        expect.objectContaining({
          ownerId: admin.userId,
          name: 'New External Library',
          refreshedAt: null,
          assetCount: 0,
          importPaths: [],
          exclusionPatterns: expect.any(Array),
        }),
      );
    });

    it('should create an external library with options', async () => {
      const { status, body } = await request(app)
        .post('/libraries')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          ownerId: admin.userId,
          name: 'My Awesome Library',
          importPaths: ['/path/to/import'],
          exclusionPatterns: ['**/Raw/**'],
        });

      expect(status).toBe(201);
      expect(body).toEqual(
        expect.objectContaining({
          name: 'My Awesome Library',
          importPaths: ['/path/to/import'],
        }),
      );
    });
  });

  describe('PUT /libraries/:id', () => {
    it('should change the library name', async () => {
      const { status, body } = await request(app)
        .put(`/libraries/${library.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'New Library Name' });

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          name: 'New Library Name',
        }),
      );
    });

    it('should change the import paths', async () => {
      const { status, body } = await request(app)
        .put(`/libraries/${library.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ importPaths: [testAssetDirInternal] });

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          importPaths: [testAssetDirInternal],
        }),
      );
    });

    it('should change the exclusion pattern', async () => {
      const { status, body } = await request(app)
        .put(`/libraries/${library.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ exclusionPatterns: ['**/Raw/**'] });

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          exclusionPatterns: ['**/Raw/**'],
        }),
      );
    });
  });

  describe('GET /libraries/:id', () => {
    it('should get library by id', async () => {
      const library = await utils.createLibrary(admin.accessToken, { ownerId: admin.userId });

      const { status, body } = await request(app)
        .get(`/libraries/${library.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          ownerId: admin.userId,
          name: 'New External Library',
          refreshedAt: null,
          assetCount: 0,
          importPaths: [],
          exclusionPatterns: expect.any(Array),
        }),
      );
    });
  });

  describe('POST /libraries/:id/scan', () => {
    it('should process metadata and thumbnails for external asset', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp/directoryA`],
      });

      await utils.scan(admin.accessToken, library.id);

      const { assets } = await utils.searchAssets(admin.accessToken, {
        originalPath: `${testAssetDirInternal}/temp/directoryA/assetA.png`,
        libraryId: library.id,
      });
      expect(assets.count).toBe(1);
      const asset = assets.items[0];
      expect(asset.exifInfo).not.toBe(null);
      expect(asset.exifInfo?.dateTimeOriginal).not.toBe(null);
      expect(asset.thumbhash).not.toBe(null);
    });

    it('should reimport a modified file', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp/reimport`],
      });

      utils.createImageFile(`${testAssetDir}/temp/reimport/asset.jpg`);
      await utimes(`${testAssetDir}/temp/reimport/asset.jpg`, 447_775_200_000);

      await utils.scan(admin.accessToken, library.id);

      cpSync(`${testAssetDir}/albums/nature/tanners_ridge.jpg`, `${testAssetDir}/temp/reimport/asset.jpg`);
      await utimes(`${testAssetDir}/temp/reimport/asset.jpg`, 447_775_200_001);

      await utils.scan(admin.accessToken, library.id);

      const { assets } = await utils.searchAssets(admin.accessToken, {
        libraryId: library.id,
      });

      expect(assets.count).toEqual(1);

      const asset = await utils.getAssetInfo(admin.accessToken, assets.items[0].id);

      expect(asset).toEqual(
        expect.objectContaining({
          originalFileName: 'asset.jpg',
          exifInfo: expect.objectContaining({
            model: 'NIKON D750',
          }),
        }),
      );

      utils.removeImageFile(`${testAssetDir}/temp/reimport/asset.jpg`);
    });

    it('should not reimport a file with unchanged timestamp', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp/reimport`],
      });

      utils.createImageFile(`${testAssetDir}/temp/reimport/asset.jpg`);
      await utimes(`${testAssetDir}/temp/reimport/asset.jpg`, 447_775_200_000);

      await utils.scan(admin.accessToken, library.id);

      cpSync(`${testAssetDir}/albums/nature/tanners_ridge.jpg`, `${testAssetDir}/temp/reimport/asset.jpg`);
      await utimes(`${testAssetDir}/temp/reimport/asset.jpg`, 447_775_200_000);

      await utils.scan(admin.accessToken, library.id);

      const { assets } = await utils.searchAssets(admin.accessToken, {
        libraryId: library.id,
      });

      expect(assets.count).toEqual(1);

      const asset = await utils.getAssetInfo(admin.accessToken, assets.items[0].id);

      expect(asset).toEqual(
        expect.objectContaining({
          originalFileName: 'asset.jpg',
          exifInfo: expect.not.objectContaining({
            model: 'NIKON D750',
          }),
        }),
      );

      utils.removeImageFile(`${testAssetDir}/temp/reimport/asset.jpg`);
    });

    it('should not reimport a modified file more than once', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp/reimport`],
      });

      utils.createImageFile(`${testAssetDir}/temp/reimport/asset.jpg`);
      await utimes(`${testAssetDir}/temp/reimport/asset.jpg`, 447_775_200_000);

      await utils.scan(admin.accessToken, library.id);

      cpSync(`${testAssetDir}/albums/nature/tanners_ridge.jpg`, `${testAssetDir}/temp/reimport/asset.jpg`);
      await utimes(`${testAssetDir}/temp/reimport/asset.jpg`, 447_775_200_001);

      await utils.scan(admin.accessToken, library.id);

      cpSync(`${testAssetDir}/albums/nature/el_torcal_rocks.jpg`, `${testAssetDir}/temp/reimport/asset.jpg`);
      await utimes(`${testAssetDir}/temp/reimport/asset.jpg`, 447_775_200_001);

      await utils.scan(admin.accessToken, library.id);

      const { assets } = await utils.searchAssets(admin.accessToken, {
        libraryId: library.id,
      });

      expect(assets.count).toEqual(1);

      const asset = await utils.getAssetInfo(admin.accessToken, assets.items[0].id);

      expect(asset).toEqual(
        expect.objectContaining({
          originalFileName: 'asset.jpg',
          exifInfo: expect.objectContaining({
            model: 'NIKON D750',
          }),
        }),
      );

      utils.removeImageFile(`${testAssetDir}/temp/reimport/asset.jpg`);
    });
  });

  describe('DELETE /libraries/:id', () => {
    it('should delete an external library', async () => {
      const library = await utils.createLibrary(admin.accessToken, { ownerId: admin.userId });

      const { status, body } = await request(app)
        .delete(`/libraries/${library.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(204);
      expect(body).toEqual({});

      const libraries = await getAllLibraries({ headers: asBearerAuth(admin.accessToken) });
      expect(libraries).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: library.id,
          }),
        ]),
      );
    });

    it('should delete an external library with assets', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp`],
      });

      await utils.scan(admin.accessToken, library.id);

      const { status, body } = await request(app)
        .delete(`/libraries/${library.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(204);
      expect(body).toEqual({});

      const libraries = await getAllLibraries({ headers: asBearerAuth(admin.accessToken) });
      expect(libraries).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: library.id,
          }),
        ]),
      );

      // ensure no files get deleted
      expect(existsSync(`${testAssetDir}/temp/directoryA/assetA.png`)).toBe(true);
      expect(existsSync(`${testAssetDir}/temp/directoryB/assetB.png`)).toBe(true);
    });
  });
});
