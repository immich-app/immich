import { LibraryResponseDto, LoginResponseDto, getAllLibraries } from '@immich/sdk';
import { cpSync, existsSync, rmSync, unlinkSync } from 'node:fs';
import { Socket } from 'socket.io-client';
import { userDto, uuidDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, testAssetDir, testAssetDirInternal, utils } from 'src/utils';
import request from 'supertest';
import { utimes } from 'utimes';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

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
      await utils.waitForQueueFinish(admin.accessToken, 'sidecar');
      await utils.waitForQueueFinish(admin.accessToken, 'metadataExtraction');

      const { assets } = await utils.searchAssets(admin.accessToken, {
        originalPath: `${testAssetDirInternal}/temp/directoryA/assetA.png`,
        libraryId: library.id,
      });
      expect(assets.count).toBe(1);
    });

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

    it('should scan external library with exclusion pattern', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp`],
        exclusionPatterns: ['**/directoryA'],
      });

      await utils.scan(admin.accessToken, library.id);

      const { assets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id });

      expect(assets.count).toBe(1);
      expect(assets.items[0].originalPath.includes('directoryB'));
    });

    it('should scan multiple import paths', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp/directoryA`, `${testAssetDirInternal}/temp/directoryB`],
      });

      await utils.scan(admin.accessToken, library.id);

      const { assets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id });

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

      await utils.scan(admin.accessToken, library.id);

      const { assets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id });

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

      await utils.scan(admin.accessToken, library.id);

      const { assets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id });

      expect(assets.count).toBe(2);
      expect(assets.items.find((asset) => asset.originalPath.includes('folder{ a'))).toBeDefined();
      expect(assets.items.find((asset) => asset.originalPath.includes('folder} b'))).toBeDefined();

      utils.removeImageFile(`${testAssetDir}/temp/folder{ a/assetA.png`);
      utils.removeImageFile(`${testAssetDir}/temp/folder} b/assetB.png`);
    });

    const annoyingChars = [
      "'",
      '"',
      '`',
      '*',
      '{',
      '}',
      ',',
      '(',
      ')',
      '[',
      ']',
      '?',
      '!',
      '@',
      '#',
      '$',
      '%',
      '^',
      '&',
      '=',
      '+',
      '~',
      '|',
      '<',
      '>',
      ';',
      ':',
      '/', // We never got backslashes to work
    ];

    it.each(annoyingChars)('should scan multiple import paths with %s', async (char) => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp/folder${char}1`, `${testAssetDirInternal}/temp/folder${char}2`],
      });

      utils.createImageFile(`${testAssetDir}/temp/folder${char}1/asset1.png`);
      utils.createImageFile(`${testAssetDir}/temp/folder${char}2/asset2.png`);

      await utils.scan(admin.accessToken, library.id);

      const { assets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id });

      expect(assets.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ originalPath: expect.stringContaining(`folder${char}1/asset1.png`) }),
          expect.objectContaining({ originalPath: expect.stringContaining(`folder${char}2/asset2.png`) }),
        ]),
      );

      utils.removeImageFile(`${testAssetDir}/temp/folder${char}1/asset1.png`);
      utils.removeImageFile(`${testAssetDir}/temp/folder${char}2/asset2.png`);
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

    it('should set an asset offline if its file is missing', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp/offline`],
      });

      utils.createImageFile(`${testAssetDir}/temp/offline/offline.png`);

      await utils.scan(admin.accessToken, library.id);

      const { assets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id });
      expect(assets.count).toBe(1);

      utils.removeImageFile(`${testAssetDir}/temp/offline/offline.png`);

      await utils.scan(admin.accessToken, library.id);

      const trashedAsset = await utils.getAssetInfo(admin.accessToken, assets.items[0].id);
      expect(trashedAsset.originalPath).toBe(`${testAssetDirInternal}/temp/offline/offline.png`);
      expect(trashedAsset.isOffline).toEqual(true);

      const { assets: newAssets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id });
      expect(newAssets.items).toEqual([]);
    });

    it('should set an asset offline if its file is not in any import path', async () => {
      utils.createImageFile(`${testAssetDir}/temp/offline/offline.png`);

      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp/offline`],
      });

      await utils.scan(admin.accessToken, library.id);

      const { assets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id });
      expect(assets.count).toBe(1);

      utils.createDirectory(`${testAssetDir}/temp/another-path/`);

      await utils.updateLibrary(admin.accessToken, library.id, {
        importPaths: [`${testAssetDirInternal}/temp/another-path/`],
      });

      await utils.scan(admin.accessToken, library.id);

      const trashedAsset = await utils.getAssetInfo(admin.accessToken, assets.items[0].id);
      expect(trashedAsset.originalPath).toBe(`${testAssetDirInternal}/temp/offline/offline.png`);
      expect(trashedAsset.isOffline).toBe(true);

      const { assets: newAssets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id });

      expect(newAssets.items).toEqual([]);

      utils.removeImageFile(`${testAssetDir}/temp/offline/offline.png`);
      utils.removeDirectory(`${testAssetDir}/temp/another-path/`);
    });

    it('should set an asset offline if its file is covered by an exclusion pattern', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp`],
      });

      await utils.scan(admin.accessToken, library.id);

      const { assets } = await utils.searchAssets(admin.accessToken, {
        libraryId: library.id,
        originalFileName: 'assetB.png',
      });
      expect(assets.count).toBe(1);

      await utils.updateLibrary(admin.accessToken, library.id, { exclusionPatterns: ['**/directoryB/**'] });

      await utils.scan(admin.accessToken, library.id);

      const trashedAsset = await utils.getAssetInfo(admin.accessToken, assets.items[0].id);
      expect(trashedAsset.isTrashed).toBe(true);
      expect(trashedAsset.originalPath).toBe(`${testAssetDirInternal}/temp/directoryB/assetB.png`);
      expect(trashedAsset.isOffline).toBe(true);

      const { assets: newAssets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id });

      expect(newAssets.items).toEqual([
        expect.objectContaining({
          originalFileName: 'assetA.png',
        }),
      ]);
    });

    it('should not set an asset offline if its file exists, is in an import path, and not covered by an exclusion pattern', async () => {
      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp`],
      });

      await utils.scan(admin.accessToken, library.id);

      const { assets: assetsBefore } = await utils.searchAssets(admin.accessToken, { libraryId: library.id });
      expect(assetsBefore.count).toBeGreaterThan(1);

      await utils.scan(admin.accessToken, library.id);

      const { assets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id });

      expect(assets).toEqual(assetsBefore);
    });

    describe('xmp metadata', async () => {
      it('should import metadata from file.xmp', async () => {
        const library = await utils.createLibrary(admin.accessToken, {
          ownerId: admin.userId,
          importPaths: [`${testAssetDirInternal}/temp/xmp`],
        });

        cpSync(`${testAssetDir}/metadata/xmp/dates/2000.xmp`, `${testAssetDir}/temp/xmp/glarus.xmp`);
        cpSync(`${testAssetDir}/formats/raw/Nikon/D80/glarus.nef`, `${testAssetDir}/temp/xmp/glarus.nef`);

        await utils.scan(admin.accessToken, library.id);

        const { assets: newAssets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id });

        expect(newAssets.items).toEqual([
          expect.objectContaining({
            originalFileName: 'glarus.nef',
            fileCreatedAt: '2000-09-27T12:35:33.000Z',
          }),
        ]);

        rmSync(`${testAssetDir}/temp/xmp`, { recursive: true, force: true });
      });

      it('should import metadata from file.ext.xmp', async () => {
        const library = await utils.createLibrary(admin.accessToken, {
          ownerId: admin.userId,
          importPaths: [`${testAssetDirInternal}/temp/xmp`],
        });

        cpSync(`${testAssetDir}/metadata/xmp/dates/2000.xmp`, `${testAssetDir}/temp/xmp/glarus.nef.xmp`);
        cpSync(`${testAssetDir}/formats/raw/Nikon/D80/glarus.nef`, `${testAssetDir}/temp/xmp/glarus.nef`);

        await utils.scan(admin.accessToken, library.id);

        const { assets: newAssets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id });

        expect(newAssets.items).toEqual([
          expect.objectContaining({
            originalFileName: 'glarus.nef',
            fileCreatedAt: '2000-09-27T12:35:33.000Z',
          }),
        ]);

        rmSync(`${testAssetDir}/temp/xmp`, { recursive: true, force: true });
      });

      it('should import metadata in file.ext.xmp before file.xmp if both exist', async () => {
        const library = await utils.createLibrary(admin.accessToken, {
          ownerId: admin.userId,
          importPaths: [`${testAssetDirInternal}/temp/xmp`],
        });

        cpSync(`${testAssetDir}/metadata/xmp/dates/2000.xmp`, `${testAssetDir}/temp/xmp/glarus.nef.xmp`);
        cpSync(`${testAssetDir}/metadata/xmp/dates/2010.xmp`, `${testAssetDir}/temp/xmp/glarus.xmp`);
        cpSync(`${testAssetDir}/formats/raw/Nikon/D80/glarus.nef`, `${testAssetDir}/temp/xmp/glarus.nef`);

        await utils.scan(admin.accessToken, library.id);

        const { assets: newAssets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id });

        expect(newAssets.items).toEqual([
          expect.objectContaining({
            originalFileName: 'glarus.nef',
            fileCreatedAt: '2000-09-27T12:35:33.000Z',
          }),
        ]);

        rmSync(`${testAssetDir}/temp/xmp`, { recursive: true, force: true });
      });

      it('should switch from using file.xmp to file.ext.xmp when asset refreshes', async () => {
        const library = await utils.createLibrary(admin.accessToken, {
          ownerId: admin.userId,
          importPaths: [`${testAssetDirInternal}/temp/xmp`],
        });

        cpSync(`${testAssetDir}/metadata/xmp/dates/2000.xmp`, `${testAssetDir}/temp/xmp/glarus.xmp`);
        cpSync(`${testAssetDir}/formats/raw/Nikon/D80/glarus.nef`, `${testAssetDir}/temp/xmp/glarus.nef`);
        await utimes(`${testAssetDir}/temp/xmp/glarus.nef`, 447_775_200_000);

        await utils.scan(admin.accessToken, library.id);

        cpSync(`${testAssetDir}/metadata/xmp/dates/2010.xmp`, `${testAssetDir}/temp/xmp/glarus.nef.xmp`);
        unlinkSync(`${testAssetDir}/temp/xmp/glarus.xmp`);
        await utimes(`${testAssetDir}/temp/xmp/glarus.nef`, 447_775_200_001);

        await utils.scan(admin.accessToken, library.id);

        const { assets: newAssets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id });

        expect(newAssets.items).toEqual([
          expect.objectContaining({
            originalFileName: 'glarus.nef',
            fileCreatedAt: '2010-09-27T12:35:33.000Z',
          }),
        ]);

        rmSync(`${testAssetDir}/temp/xmp`, { recursive: true, force: true });
      });

      it('should switch from using file metadata to file.xmp metadata when asset refreshes', async () => {
        const library = await utils.createLibrary(admin.accessToken, {
          ownerId: admin.userId,
          importPaths: [`${testAssetDirInternal}/temp/xmp`],
        });

        cpSync(`${testAssetDir}/formats/raw/Nikon/D80/glarus.nef`, `${testAssetDir}/temp/xmp/glarus.nef`);
        await utimes(`${testAssetDir}/temp/xmp/glarus.nef`, 447_775_200_000);

        await utils.scan(admin.accessToken, library.id);

        cpSync(`${testAssetDir}/metadata/xmp/dates/2000.xmp`, `${testAssetDir}/temp/xmp/glarus.xmp`);
        await utimes(`${testAssetDir}/temp/xmp/glarus.nef`, 447_775_200_001);

        await utils.scan(admin.accessToken, library.id);

        const { assets: newAssets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id });

        expect(newAssets.items).toEqual([
          expect.objectContaining({
            originalFileName: 'glarus.nef',
            fileCreatedAt: '2000-09-27T12:35:33.000Z',
          }),
        ]);

        rmSync(`${testAssetDir}/temp/xmp`, { recursive: true, force: true });
      });

      it('should switch from using file metadata to file.xmp metadata when asset refreshes', async () => {
        const library = await utils.createLibrary(admin.accessToken, {
          ownerId: admin.userId,
          importPaths: [`${testAssetDirInternal}/temp/xmp`],
        });

        cpSync(`${testAssetDir}/formats/raw/Nikon/D80/glarus.nef`, `${testAssetDir}/temp/xmp/glarus.nef`);
        await utimes(`${testAssetDir}/temp/xmp/glarus.nef`, 447_775_200_000);

        await utils.scan(admin.accessToken, library.id);

        cpSync(`${testAssetDir}/metadata/xmp/dates/2000.xmp`, `${testAssetDir}/temp/xmp/glarus.nef.xmp`);
        await utimes(`${testAssetDir}/temp/xmp/glarus.nef`, 447_775_200_001);

        await utils.scan(admin.accessToken, library.id);

        const { assets: newAssets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id });

        expect(newAssets.items).toEqual([
          expect.objectContaining({
            originalFileName: 'glarus.nef',
            fileCreatedAt: '2000-09-27T12:35:33.000Z',
          }),
        ]);

        rmSync(`${testAssetDir}/temp/xmp`, { recursive: true, force: true });
      });

      it('should switch from using file.ext.xmp to file.xmp when asset refreshes', async () => {
        const library = await utils.createLibrary(admin.accessToken, {
          ownerId: admin.userId,
          importPaths: [`${testAssetDirInternal}/temp/xmp`],
        });

        cpSync(`${testAssetDir}/metadata/xmp/dates/2000.xmp`, `${testAssetDir}/temp/xmp/glarus.nef.xmp`);
        cpSync(`${testAssetDir}/formats/raw/Nikon/D80/glarus.nef`, `${testAssetDir}/temp/xmp/glarus.nef`);
        await utimes(`${testAssetDir}/temp/xmp/glarus.nef`, 447_775_200_000);

        await utils.scan(admin.accessToken, library.id);

        cpSync(`${testAssetDir}/metadata/xmp/dates/2010.xmp`, `${testAssetDir}/temp/xmp/glarus.xmp`);
        unlinkSync(`${testAssetDir}/temp/xmp/glarus.nef.xmp`);
        await utimes(`${testAssetDir}/temp/xmp/glarus.nef`, 447_775_200_001);

        await utils.scan(admin.accessToken, library.id);

        const { assets: newAssets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id });

        expect(newAssets.items).toEqual([
          expect.objectContaining({
            originalFileName: 'glarus.nef',
            fileCreatedAt: '2010-09-27T12:35:33.000Z',
          }),
        ]);

        rmSync(`${testAssetDir}/temp/xmp`, { recursive: true, force: true });
      });

      it('should switch from using file.ext.xmp to file metadata', async () => {
        const library = await utils.createLibrary(admin.accessToken, {
          ownerId: admin.userId,
          importPaths: [`${testAssetDirInternal}/temp/xmp`],
        });

        cpSync(`${testAssetDir}/metadata/xmp/dates/2000.xmp`, `${testAssetDir}/temp/xmp/glarus.nef.xmp`);
        cpSync(`${testAssetDir}/formats/raw/Nikon/D80/glarus.nef`, `${testAssetDir}/temp/xmp/glarus.nef`);
        await utimes(`${testAssetDir}/temp/xmp/glarus.nef`, 447_775_200_000);

        await utils.scan(admin.accessToken, library.id);

        unlinkSync(`${testAssetDir}/temp/xmp/glarus.nef.xmp`);
        await utimes(`${testAssetDir}/temp/xmp/glarus.nef`, 447_775_200_001);

        await utils.scan(admin.accessToken, library.id);

        const { assets: newAssets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id });

        expect(newAssets.items).toEqual([
          expect.objectContaining({
            originalFileName: 'glarus.nef',
            fileCreatedAt: '2010-07-20T17:27:12.000Z',
          }),
        ]);

        rmSync(`${testAssetDir}/temp/xmp`, { recursive: true, force: true });
      });

      it('should switch from using file.xmp to file metadata', async () => {
        const library = await utils.createLibrary(admin.accessToken, {
          ownerId: admin.userId,
          importPaths: [`${testAssetDirInternal}/temp/xmp`],
        });

        cpSync(`${testAssetDir}/metadata/xmp/dates/2000.xmp`, `${testAssetDir}/temp/xmp/glarus.xmp`);
        cpSync(`${testAssetDir}/formats/raw/Nikon/D80/glarus.nef`, `${testAssetDir}/temp/xmp/glarus.nef`);
        await utimes(`${testAssetDir}/temp/xmp/glarus.nef`, 447_775_200_000);

        await utils.scan(admin.accessToken, library.id);

        unlinkSync(`${testAssetDir}/temp/xmp/glarus.xmp`);
        await utimes(`${testAssetDir}/temp/xmp/glarus.nef`, 447_775_200_001);

        await utils.scan(admin.accessToken, library.id);

        const { assets: newAssets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id });

        expect(newAssets.items).toEqual([
          expect.objectContaining({
            originalFileName: 'glarus.nef',
            fileCreatedAt: '2010-07-20T17:27:12.000Z',
          }),
        ]);

        rmSync(`${testAssetDir}/temp/xmp`, { recursive: true, force: true });
      });
    });

    it('should set an offline asset to online if its file exists, is in an import path, and not covered by an exclusion pattern', async () => {
      utils.createImageFile(`${testAssetDir}/temp/offline/offline.png`);

      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp/offline`],
      });

      await utils.scan(admin.accessToken, library.id);

      const { assets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id });

      expect(assets.count).toBe(1);

      utils.renameImageFile(`${testAssetDir}/temp/offline/offline.png`, `${testAssetDir}/temp/offline.png`);

      await utils.scan(admin.accessToken, library.id);

      const offlineAsset = await utils.getAssetInfo(admin.accessToken, assets.items[0].id);
      expect(offlineAsset.isTrashed).toBe(true);
      expect(offlineAsset.originalPath).toBe(`${testAssetDirInternal}/temp/offline/offline.png`);
      expect(offlineAsset.isOffline).toBe(true);

      {
        const { assets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id, withDeleted: true });
        expect(assets.count).toBe(1);
      }

      utils.renameImageFile(`${testAssetDir}/temp/offline.png`, `${testAssetDir}/temp/offline/offline.png`);

      await utils.scan(admin.accessToken, library.id);

      const backOnlineAsset = await utils.getAssetInfo(admin.accessToken, assets.items[0].id);

      expect(backOnlineAsset.isTrashed).toBe(false);
      expect(backOnlineAsset.originalPath).toBe(`${testAssetDirInternal}/temp/offline/offline.png`);
      expect(backOnlineAsset.isOffline).toBe(false);

      {
        const { assets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id });
        expect(assets.count).toBe(1);
      }
    });

    it('should set a trashed offline asset to online but keep it in trash', async () => {
      utils.createImageFile(`${testAssetDir}/temp/offline/offline.png`);

      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp/offline`],
      });

      await utils.scan(admin.accessToken, library.id);

      const { assets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id });

      expect(assets.count).toBe(1);

      await utils.deleteAssets(admin.accessToken, [assets.items[0].id]);

      {
        const trashedAsset = await utils.getAssetInfo(admin.accessToken, assets.items[0].id);

        expect(trashedAsset.isTrashed).toBe(true);
      }

      utils.renameImageFile(`${testAssetDir}/temp/offline/offline.png`, `${testAssetDir}/temp/offline.png`);

      await utils.scan(admin.accessToken, library.id);

      const offlineAsset = await utils.getAssetInfo(admin.accessToken, assets.items[0].id);
      expect(offlineAsset.isTrashed).toBe(true);
      expect(offlineAsset.originalPath).toBe(`${testAssetDirInternal}/temp/offline/offline.png`);
      expect(offlineAsset.isOffline).toBe(true);

      {
        const { assets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id, withDeleted: true });
        expect(assets.count).toBe(1);
      }

      utils.renameImageFile(`${testAssetDir}/temp/offline.png`, `${testAssetDir}/temp/offline/offline.png`);

      await utils.scan(admin.accessToken, library.id);

      const backOnlineAsset = await utils.getAssetInfo(admin.accessToken, assets.items[0].id);

      expect(backOnlineAsset.originalPath).toBe(`${testAssetDirInternal}/temp/offline/offline.png`);
      expect(backOnlineAsset.isOffline).toBe(false);
      expect(backOnlineAsset.isTrashed).toBe(true);

      {
        const { assets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id, withDeleted: true });
        expect(assets.count).toBe(1);
      }
    });

    it('should not set an offline asset to online if its file exists, is not covered by an exclusion pattern, but is outside of all import paths', async () => {
      utils.createImageFile(`${testAssetDir}/temp/offline/offline.png`);

      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp/offline`],
      });

      await utils.scan(admin.accessToken, library.id);

      const { assets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id });

      utils.renameImageFile(`${testAssetDir}/temp/offline/offline.png`, `${testAssetDir}/temp/offline.png`);

      await utils.scan(admin.accessToken, library.id);

      {
        const { assets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id, withDeleted: true });
        expect(assets.count).toBe(1);
      }

      const offlineAsset = await utils.getAssetInfo(admin.accessToken, assets.items[0].id);

      expect(offlineAsset.isTrashed).toBe(true);
      expect(offlineAsset.originalPath).toBe(`${testAssetDirInternal}/temp/offline/offline.png`);
      expect(offlineAsset.isOffline).toBe(true);

      utils.renameImageFile(`${testAssetDir}/temp/offline.png`, `${testAssetDir}/temp/offline/offline.png`);

      utils.createDirectory(`${testAssetDir}/temp/another-path/`);

      await utils.updateLibrary(admin.accessToken, library.id, {
        importPaths: [`${testAssetDirInternal}/temp/another-path`],
      });

      await utils.scan(admin.accessToken, library.id);

      const stillOfflineAsset = await utils.getAssetInfo(admin.accessToken, assets.items[0].id);

      expect(stillOfflineAsset.isTrashed).toBe(true);
      expect(stillOfflineAsset.originalPath).toBe(`${testAssetDirInternal}/temp/offline/offline.png`);
      expect(stillOfflineAsset.isOffline).toBe(true);

      {
        const { assets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id, withDeleted: true });
        expect(assets.count).toBe(1);
      }

      utils.removeDirectory(`${testAssetDir}/temp/another-path/`);
    });

    it('should not set an offline asset to online if its file exists, is in an import path, but is covered by an exclusion pattern', async () => {
      utils.createImageFile(`${testAssetDir}/temp/offline/offline.png`);

      const library = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        importPaths: [`${testAssetDirInternal}/temp/offline`],
      });

      await utils.scan(admin.accessToken, library.id);

      {
        const { assets: assetsBefore } = await utils.searchAssets(admin.accessToken, { libraryId: library.id });
        expect(assetsBefore.count).toBe(1);
      }

      utils.renameImageFile(`${testAssetDir}/temp/offline/offline.png`, `${testAssetDir}/temp/offline.png`);

      await utils.scan(admin.accessToken, library.id);

      const { assets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id, withDeleted: true });
      expect(assets.count).toBe(1);

      const offlineAsset = await utils.getAssetInfo(admin.accessToken, assets.items[0].id);

      expect(offlineAsset.isTrashed).toBe(true);
      expect(offlineAsset.originalPath).toBe(`${testAssetDirInternal}/temp/offline/offline.png`);
      expect(offlineAsset.isOffline).toBe(true);

      utils.renameImageFile(`${testAssetDir}/temp/offline.png`, `${testAssetDir}/temp/offline/offline.png`);

      await utils.updateLibrary(admin.accessToken, library.id, { exclusionPatterns: ['**/offline/**'] });

      await utils.scan(admin.accessToken, library.id);

      const stillOfflineAsset = await utils.getAssetInfo(admin.accessToken, assets.items[0].id);

      expect(stillOfflineAsset.isTrashed).toBe(true);
      expect(stillOfflineAsset.originalPath).toBe(`${testAssetDirInternal}/temp/offline/offline.png`);
      expect(stillOfflineAsset.isOffline).toBe(true);

      {
        const { assets } = await utils.searchAssets(admin.accessToken, { libraryId: library.id, withDeleted: true });
        expect(assets.count).toBe(1);
      }
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

    it("should fail if path isn't absolute", async () => {
      const pathToTest = `relative/path`;

      const cwd = process.cwd();
      // Create directory in cwd
      utils.createDirectory(`${cwd}/${pathToTest}`);

      const response = await utils.validateLibrary(admin.accessToken, library.id, {
        importPaths: [pathToTest],
      });

      utils.removeDirectory(`${cwd}/${pathToTest}`);

      expect(response.importPaths?.length).toEqual(1);
      const pathResponse = response?.importPaths?.at(0);

      expect(pathResponse).toEqual({
        importPath: pathToTest,
        isValid: false,
        message: expect.stringMatching('Import path must be absolute, try /usr/src/app/relative/path'),
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
