import { LibraryResponseDto, LoginResponseDto, ScanLibraryDto, getAllLibraries, scanLibrary } from '@immich/sdk';
import { cpSync, existsSync } from 'node:fs';
import { Socket } from 'socket.io-client';
import { userDto, uuidDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, testAssetDir, testAssetDirInternal, utils } from 'src/utils';
import request from 'supertest';
import { utimes } from 'utimes';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const scan = async (accessToken: string, id: string, dto: ScanLibraryDto = {}) =>
  scanLibrary({ id, scanLibraryDto: dto }, { headers: asBearerAuth(accessToken) });

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
          exclusionPatterns: [],
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
          exclusionPatterns: [],
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

    it('should scan external library', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp/directoryA`],
      });

      await scan(admin.accessToken, library.id);
      await utils.waitForWebsocketEvent({ event: 'assetUpload', total: 1 });

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

      await scan(admin.accessToken, library.id);
      await utils.waitForWebsocketEvent({ event: 'assetUpload', total: 1 });

      const { assets } = await utils.metadataSearch(admin.accessToken, { libraryId: library.id });

      expect(assets.count).toBe(1);
      expect(assets.items[0].originalPath.includes('directoryB'));
    });

    it('should scan multiple import paths', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp/directoryA`, `${testAssetDirInternal}/temp/directoryB`],
      });

      await scan(admin.accessToken, library.id);
      await utils.waitForWebsocketEvent({ event: 'assetUpload', total: 2 });

      const { assets } = await utils.metadataSearch(admin.accessToken, { libraryId: library.id });

      expect(assets.count).toBe(2);
      expect(assets.items.find((asset) => asset.originalPath.includes('directoryA'))).toBeDefined();
      expect(assets.items.find((asset) => asset.originalPath.includes('directoryB'))).toBeDefined();
    });

    it('should pick up new files', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp`],
      });

      await scan(admin.accessToken, library.id);
      await utils.waitForWebsocketEvent({ event: 'assetUpload', total: 2 });

      const { assets } = await utils.metadataSearch(admin.accessToken, { libraryId: library.id });

      expect(assets.count).toBe(2);

      utils.createImageFile(`${testAssetDir}/temp/directoryA/assetB.png`);

      await scan(admin.accessToken, library.id);
      await utils.waitForWebsocketEvent({ event: 'assetUpload', total: 3 });

      const { assets: newAssets } = await utils.metadataSearch(admin.accessToken, { libraryId: library.id });

      expect(newAssets.count).toBe(3);
      utils.removeImageFile(`${testAssetDir}/temp/directoryA/assetB.png`);
    });

    it('should offline missing files', async () => {
      utils.createImageFile(`${testAssetDir}/temp/directoryA/assetB.png`);
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp`],
      });

      await scan(admin.accessToken, library.id);
      await utils.waitForQueueFinish(admin.accessToken, 'library');

      utils.removeImageFile(`${testAssetDir}/temp/directoryA/assetB.png`);

      await scan(admin.accessToken, library.id);
      await utils.waitForQueueFinish(admin.accessToken, 'library');

      const { assets } = await utils.metadataSearch(admin.accessToken, { libraryId: library.id });

      expect(assets.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            isOffline: true,
            originalFileName: 'assetB.png',
          }),
        ]),
      );
    });

    it('should scan new files', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp`],
      });

      await scan(admin.accessToken, library.id);
      await utils.waitForQueueFinish(admin.accessToken, 'library');

      utils.createImageFile(`${testAssetDir}/temp/directoryA/assetC.png`);

      await scan(admin.accessToken, library.id);
      await utils.waitForQueueFinish(admin.accessToken, 'library');

      utils.removeImageFile(`${testAssetDir}/temp/directoryA/assetC.png`);
      const { assets } = await utils.metadataSearch(admin.accessToken, { libraryId: library.id });

      expect(assets.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            originalFileName: 'assetC.png',
          }),
        ]),
      );
    });

    describe('with refreshModifiedFiles=true', () => {
      it('should reimport modified files', async () => {
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

        await scan(admin.accessToken, library.id, { refreshModifiedFiles: true });
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

        await scan(admin.accessToken, library.id, { refreshModifiedFiles: true });
        await utils.waitForQueueFinish(admin.accessToken, 'library');
        await utils.waitForQueueFinish(admin.accessToken, 'metadataExtraction');
        utils.removeImageFile(`${testAssetDir}/temp/directoryA/assetB.jpg`);

        const { assets } = await utils.metadataSearch(admin.accessToken, {
          libraryId: library.id,
          model: 'NIKON D750',
        });
        expect(assets.count).toBe(0);
      });
    });

    describe('with refreshAllFiles=true', () => {
      it('should reimport all files', async () => {
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

        await scan(admin.accessToken, library.id, { refreshAllFiles: true });
        await utils.waitForQueueFinish(admin.accessToken, 'library');
        await utils.waitForQueueFinish(admin.accessToken, 'metadataExtraction');
        utils.removeImageFile(`${testAssetDir}/temp/directoryA/assetB.jpg`);

        const { assets } = await utils.metadataSearch(admin.accessToken, {
          libraryId: library.id,
          model: 'NIKON D750',
        });
        expect(assets.count).toBe(1);
      });
    });
  });

  describe('POST /libraries/:id/removeOffline', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post(`/libraries/${uuidDto.notFound}/removeOffline`).send({});

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should remove offline files', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp`],
      });

      utils.createImageFile(`${testAssetDir}/temp/directoryA/assetB.png`);

      await scan(admin.accessToken, library.id);
      await utils.waitForQueueFinish(admin.accessToken, 'library');

      const { assets: initialAssets } = await utils.metadataSearch(admin.accessToken, {
        libraryId: library.id,
      });
      expect(initialAssets.count).toBe(3);

      utils.removeImageFile(`${testAssetDir}/temp/directoryA/assetB.png`);

      await scan(admin.accessToken, library.id);
      await utils.waitForQueueFinish(admin.accessToken, 'library');

      const { assets: offlineAssets } = await utils.metadataSearch(admin.accessToken, {
        libraryId: library.id,
        isOffline: true,
      });
      expect(offlineAssets.count).toBe(1);

      const { status } = await request(app)
        .post(`/libraries/${library.id}/removeOffline`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send();
      expect(status).toBe(204);
      await utils.waitForQueueFinish(admin.accessToken, 'library');
      await utils.waitForQueueFinish(admin.accessToken, 'backgroundTask');

      const { assets } = await utils.metadataSearch(admin.accessToken, { libraryId: library.id });

      expect(assets.count).toBe(2);
    });

    it('should not remove online files', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp`],
      });

      await scan(admin.accessToken, library.id);
      await utils.waitForQueueFinish(admin.accessToken, 'library');

      const { assets: assetsBefore } = await utils.metadataSearch(admin.accessToken, { libraryId: library.id });
      expect(assetsBefore.count).toBeGreaterThan(1);

      const { status } = await request(app)
        .post(`/libraries/${library.id}/removeOffline`)
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
      await utils.waitForWebsocketEvent({ event: 'assetUpload', total: 2 });

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
