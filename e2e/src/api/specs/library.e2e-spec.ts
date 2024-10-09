import { LibraryResponseDto, LoginResponseDto, getAllLibraries, scanLibrary } from '@immich/sdk';
import { cpSync, existsSync } from 'node:fs';
import { Socket } from 'socket.io-client';
import { userDto, uuidDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, testAssetDir, testAssetDirInternal, utils } from 'src/utils';
import request from 'supertest';
import { utimes } from 'utimes';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const scan = async (accessToken: string, id: string) => scanLibrary({ id }, { headers: asBearerAuth(accessToken) });

describe('/libraries', () => {
  let admin: LoginResponseDto;
  let user: LoginResponseDto;
  let library: LibraryResponseDto;
  let websocket: Socket;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    await utils.resetAdminConfig(admin.accessToken);
    user = await utils.userSetup(admin.accessToken, userDto.user1);
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

  describe('GET /libraries', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/libraries');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });
  });

  describe('POST /libraries', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post('/libraries').send({});
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require admin authentication', async () => {
      const { status, body } = await request(app)
        .post('/libraries')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ ownerId: admin.userId });

      expect(status).toBe(403);
      expect(body).toEqual(errorDto.forbidden);
    });

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

    it('should not create an external library with duplicate import paths', async () => {
      const { status, body } = await request(app)
        .post('/libraries')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          ownerId: admin.userId,
          name: 'My Awesome Library',
          importPaths: ['/path', '/path'],
          exclusionPatterns: ['**/Raw/**'],
        });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(["All importPaths's elements must be unique"]));
    });

    it('should not create an external library with duplicate exclusion patterns', async () => {
      const { status, body } = await request(app)
        .post('/libraries')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          ownerId: admin.userId,
          name: 'My Awesome Library',
          importPaths: ['/path/to/import'],
          exclusionPatterns: ['**/Raw/**', '**/Raw/**'],
        });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(["All exclusionPatterns's elements must be unique"]));
    });
  });

  describe('PUT /libraries/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).put(`/libraries/${uuidDto.notFound}`).send({});
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

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

    it('should not set an empty name', async () => {
      const { status, body } = await request(app)
        .put(`/libraries/${library.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: '' });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['name should not be empty']));
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

    it('should reject an empty import path', async () => {
      const { status, body } = await request(app)
        .put(`/libraries/${library.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ importPaths: [''] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['each value in importPaths should not be empty']));
    });

    it('should reject duplicate import paths', async () => {
      const { status, body } = await request(app)
        .put(`/libraries/${library.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ importPaths: ['/path', '/path'] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(["All importPaths's elements must be unique"]));
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

    it('should reject duplicate exclusion patterns', async () => {
      const { status, body } = await request(app)
        .put(`/libraries/${library.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ exclusionPatterns: ['**/*.jpg', '**/*.jpg'] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(["All exclusionPatterns's elements must be unique"]));
    });

    it('should reject an empty exclusion pattern', async () => {
      const { status, body } = await request(app)
        .put(`/libraries/${library.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ exclusionPatterns: [''] });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['each value in exclusionPatterns should not be empty']));
    });
  });

  describe('GET /libraries/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get(`/libraries/${uuidDto.notFound}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require admin access', async () => {
      const { status, body } = await request(app)
        .get(`/libraries/${uuidDto.notFound}`)
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(status).toBe(403);
      expect(body).toEqual(errorDto.forbidden);
    });

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

  describe('GET /libraries/:id/statistics', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get(`/libraries/${uuidDto.notFound}/statistics`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });
  });

  describe('POST /libraries/:id/scan', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post(`/libraries/${uuidDto.notFound}/scan`).send({});

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should import new asset when scanning external library', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp/directoryA`],
      });

      const { status } = await request(app)
        .post(`/libraries/${library.id}/scan`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send();
      expect(status).toBe(204);

      await utils.waitForQueueFinish(admin.accessToken, 'library');

      const { assets } = await utils.metadataSearch(admin.accessToken, {
        originalPath: `${testAssetDirInternal}/temp/directoryA/assetA.png`,
      });
      expect(assets.count).toBe(1);
    });

    it('should scan external library with exclusion pattern', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp`],
        exclusionPatterns: ['**/directoryA'],
      });

      const { status } = await request(app)
        .post(`/libraries/${library.id}/scan`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send();
      expect(status).toBe(204);

      await utils.waitForQueueFinish(admin.accessToken, 'library');

      const { assets } = await utils.metadataSearch(admin.accessToken, { libraryId: library.id });

      expect(assets.count).toBe(1);
      expect(assets.items[0].originalPath.includes('directoryB'));
    });

    it('should scan multiple import paths', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp/directoryA`, `${testAssetDirInternal}/temp/directoryB`],
      });

      const { status } = await request(app)
        .post(`/libraries/${library.id}/scan`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send();
      expect(status).toBe(204);

      await utils.waitForQueueFinish(admin.accessToken, 'library');

      const { assets } = await utils.metadataSearch(admin.accessToken, { libraryId: library.id });

      expect(assets.count).toBe(2);
      expect(assets.items.find((asset) => asset.originalPath.includes('directoryA'))).toBeDefined();
      expect(assets.items.find((asset) => asset.originalPath.includes('directoryB'))).toBeDefined();
    });

    it('should scan multiple import paths with commas', async () => {
      // https://github.com/immich-app/immich/issues/10699
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp/folder, a`, `${testAssetDirInternal}/temp/folder, b`],
      });

      utils.createImageFile(`${testAssetDir}/temp/folder, a/assetA.png`);
      utils.createImageFile(`${testAssetDir}/temp/folder, b/assetB.png`);

      const { status } = await request(app)
        .post(`/libraries/${library.id}/scan`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send();
      expect(status).toBe(204);

      await utils.waitForQueueFinish(admin.accessToken, 'library');

      const { assets } = await utils.metadataSearch(admin.accessToken, { libraryId: library.id });

      expect(assets.count).toBe(2);
      expect(assets.items.find((asset) => asset.originalPath.includes('folder, a'))).toBeDefined();
      expect(assets.items.find((asset) => asset.originalPath.includes('folder, b'))).toBeDefined();

      utils.removeImageFile(`${testAssetDir}/temp/folder, a/assetA.png`);
      utils.removeImageFile(`${testAssetDir}/temp/folder, b/assetB.png`);
    });

    it('should scan multiple import paths with braces', async () => {
      // https://github.com/immich-app/immich/issues/10699
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp/folder{ a`, `${testAssetDirInternal}/temp/folder} b`],
      });

      utils.createImageFile(`${testAssetDir}/temp/folder{ a/assetA.png`);
      utils.createImageFile(`${testAssetDir}/temp/folder} b/assetB.png`);

      const { status } = await request(app)
        .post(`/libraries/${library.id}/scan`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send();
      expect(status).toBe(204);

      await utils.waitForQueueFinish(admin.accessToken, 'library');

      const { assets } = await utils.metadataSearch(admin.accessToken, { libraryId: library.id });

      expect(assets.count).toBe(2);
      expect(assets.items.find((asset) => asset.originalPath.includes('folder{ a'))).toBeDefined();
      expect(assets.items.find((asset) => asset.originalPath.includes('folder} b'))).toBeDefined();

      utils.removeImageFile(`${testAssetDir}/temp/folder{ a/assetA.png`);
      utils.removeImageFile(`${testAssetDir}/temp/folder} b/assetB.png`);
    });

    it('should reimport a modified file', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp`],
      });

      utils.createImageFile(`${testAssetDir}/temp/directoryA/assetB.jpg`);
      await utimes(`${testAssetDir}/temp/directoryA/assetB.jpg`, 447_775_200_000);

      await scan(admin.accessToken, library.id);
      await utils.waitForQueueFinish(admin.accessToken, 'library');

      cpSync(`${testAssetDir}/albums/nature/tanners_ridge.jpg`, `${testAssetDir}/temp/directoryA/assetB.jpg`);
      await utimes(`${testAssetDir}/temp/directoryA/assetB.jpg`, 447_775_200_001);

      const { status } = await request(app)
        .post(`/libraries/${library.id}/scan`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ refreshModifiedFiles: true });
      expect(status).toBe(204);

      await utils.waitForQueueFinish(admin.accessToken, 'library');
      await utils.waitForQueueFinish(admin.accessToken, 'metadataExtraction');
      utils.removeImageFile(`${testAssetDir}/temp/directoryA/assetB.jpg`);

      const { assets } = await utils.metadataSearch(admin.accessToken, {
        libraryId: library.id,
        model: 'NIKON D750',
      });
      expect(assets.count).toBe(1);
    });

    it('should not reimport unmodified files', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp`],
      });

      utils.createImageFile(`${testAssetDir}/temp/directoryA/assetB.jpg`);
      await utimes(`${testAssetDir}/temp/directoryA/assetB.jpg`, 447_775_200_000);

      await scan(admin.accessToken, library.id);
      await utils.waitForQueueFinish(admin.accessToken, 'library');

      cpSync(`${testAssetDir}/albums/nature/tanners_ridge.jpg`, `${testAssetDir}/temp/directoryA/assetB.jpg`);
      await utimes(`${testAssetDir}/temp/directoryA/assetB.jpg`, 447_775_200_000);

      const { status } = await request(app)
        .post(`/libraries/${library.id}/scan`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ refreshModifiedFiles: true });
      expect(status).toBe(204);

      await utils.waitForQueueFinish(admin.accessToken, 'library');
      await utils.waitForQueueFinish(admin.accessToken, 'metadataExtraction');
      utils.removeImageFile(`${testAssetDir}/temp/directoryA/assetB.jpg`);

      const { assets } = await utils.metadataSearch(admin.accessToken, {
        libraryId: library.id,
        model: 'NIKON D750',
      });
      expect(assets.count).toBe(0);
    });

    it('should set an asset offline if its file is missing', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp/offline`],
      });

      utils.createImageFile(`${testAssetDir}/temp/offline/offline.png`);

      await scan(admin.accessToken, library.id);
      await utils.waitForQueueFinish(admin.accessToken, 'library');

      const { assets } = await utils.metadataSearch(admin.accessToken, { libraryId: library.id });
      expect(assets.count).toBe(1);

      utils.removeImageFile(`${testAssetDir}/temp/offline/offline.png`);

      const { status } = await request(app)
        .post(`/libraries/${library.id}/scan`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send();
      expect(status).toBe(204);

      await utils.waitForQueueFinish(admin.accessToken, 'library');

      const trashedAsset = await utils.getAssetInfo(admin.accessToken, assets.items[0].id);
      expect(trashedAsset.originalPath).toBe(`${testAssetDirInternal}/temp/offline/offline.png`);
      expect(trashedAsset.isOffline).toEqual(true);

      const { assets: newAssets } = await utils.metadataSearch(admin.accessToken, { libraryId: library.id });
      expect(newAssets.items).toEqual([]);
    });

    it('should set an asset offline its file is not in any import path', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp/offline`],
      });

      utils.createImageFile(`${testAssetDir}/temp/offline/offline.png`);

      await scan(admin.accessToken, library.id);
      await utils.waitForQueueFinish(admin.accessToken, 'library');

      const { assets } = await utils.metadataSearch(admin.accessToken, { libraryId: library.id });
      expect(assets.count).toBe(1);

      utils.createDirectory(`${testAssetDir}/temp/another-path/`);

      await request(app)
        .put(`/libraries/${library.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ importPaths: [`${testAssetDirInternal}/temp/another-path/`] });

      const { status } = await request(app)
        .post(`/libraries/${library.id}/scan`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send();
      expect(status).toBe(204);

      await utils.waitForQueueFinish(admin.accessToken, 'library');

      const trashedAsset = await utils.getAssetInfo(admin.accessToken, assets.items[0].id);
      expect(trashedAsset.originalPath).toBe(`${testAssetDirInternal}/temp/offline/offline.png`);
      expect(trashedAsset.isOffline).toBe(true);

      const { assets: newAssets } = await utils.metadataSearch(admin.accessToken, { libraryId: library.id });

      expect(newAssets.items).toEqual([]);

      utils.removeImageFile(`${testAssetDir}/temp/offline/offline.png`);
      utils.removeDirectory(`${testAssetDir}/temp/another-path/`);
    });

    it('should set an asset offline if its file is covered by an exclusion pattern', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp`],
      });

      await scan(admin.accessToken, library.id);
      await utils.waitForQueueFinish(admin.accessToken, 'library');

      const { assets } = await utils.metadataSearch(admin.accessToken, {
        libraryId: library.id,
        originalFileName: 'assetB.png',
      });
      expect(assets.count).toBe(1);

      await request(app)
        .put(`/libraries/${library.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ exclusionPatterns: ['**/directoryB/**'] });

      await scan(admin.accessToken, library.id);
      await utils.waitForQueueFinish(admin.accessToken, 'library');

      const trashedAsset = await utils.getAssetInfo(admin.accessToken, assets.items[0].id);
      expect(trashedAsset.isTrashed).toBe(true);
      expect(trashedAsset.originalPath).toBe(`${testAssetDirInternal}/temp/directoryB/assetB.png`);
      expect(trashedAsset.isOffline).toBe(true);

      const { assets: newAssets } = await utils.metadataSearch(admin.accessToken, { libraryId: library.id });

      expect(newAssets.items).toEqual([
        expect.objectContaining({
          originalFileName: 'assetA.png',
        }),
      ]);
    });

    it('should not trash an online asset', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp`],
      });

      await scan(admin.accessToken, library.id);
      await utils.waitForQueueFinish(admin.accessToken, 'library');

      const { assets: assetsBefore } = await utils.metadataSearch(admin.accessToken, { libraryId: library.id });
      expect(assetsBefore.count).toBeGreaterThan(1);

      const { status } = await request(app)
        .post(`/libraries/${library.id}/scan`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send();
      expect(status).toBe(204);

      await utils.waitForQueueFinish(admin.accessToken, 'library');

      const { assets } = await utils.metadataSearch(admin.accessToken, { libraryId: library.id });

      expect(assets).toEqual(assetsBefore);
    });
  });

  describe('POST /libraries/:id/validate', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post(`/libraries/${uuidDto.notFound}/validate`).send({});

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should pass with no import paths', async () => {
      const response = await utils.validateLibrary(admin.accessToken, library.id, { importPaths: [] });
      expect(response.importPaths).toEqual([]);
    });

    it('should fail if path does not exist', async () => {
      const pathToTest = `${testAssetDirInternal}/does/not/exist`;

      const response = await utils.validateLibrary(admin.accessToken, library.id, {
        importPaths: [pathToTest],
      });

      expect(response.importPaths?.length).toEqual(1);
      const pathResponse = response?.importPaths?.at(0);

      expect(pathResponse).toEqual({
        importPath: pathToTest,
        isValid: false,
        message: `Path does not exist (ENOENT)`,
      });
    });

    it('should fail if path is a file', async () => {
      const pathToTest = `${testAssetDirInternal}/albums/nature/el_torcal_rocks.jpg`;

      const response = await utils.validateLibrary(admin.accessToken, library.id, {
        importPaths: [pathToTest],
      });

      expect(response.importPaths?.length).toEqual(1);
      const pathResponse = response?.importPaths?.at(0);

      expect(pathResponse).toEqual({
        importPath: pathToTest,
        isValid: false,
        message: `Not a directory`,
      });
    });
  });

  describe('DELETE /libraries/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).delete(`/libraries/${uuidDto.notFound}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

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

      await scan(admin.accessToken, library.id);
      await utils.waitForQueueFinish(admin.accessToken, 'library');

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
