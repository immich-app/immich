import { LibraryResponseDto, LoginResponseDto } from '@app/domain';
import { LibraryController } from '@app/immich';
import { AssetType, LibraryType } from '@app/infra/entities';
import { errorStub, uuidStub } from '@test/fixtures';
import * as fs from 'fs';
import request from 'supertest';
import { utimes } from 'utimes';
import {
  IMMICH_TEST_ASSET_PATH,
  IMMICH_TEST_ASSET_TEMP_PATH,
  restoreTempFolder,
  testApp,
} from '../../../src/test-utils/utils';
import { api } from '../../client';

describe(`${LibraryController.name} (e2e)`, () => {
  let server: any;
  let admin: LoginResponseDto;

  beforeAll(async () => {
    server = (await testApp.create()).getHttpServer();
  });

  beforeEach(async () => {
    await testApp.reset();
    await restoreTempFolder();
    await api.authApi.adminSignUp(server);
    admin = await api.authApi.adminLogin(server);
  });

  afterAll(async () => {
    await testApp.teardown();
    await restoreTempFolder();
  });

  describe('DELETE /library/:id', () => {
    it('should delete an external library with assets', async () => {
      const library = await api.libraryApi.create(server, admin.accessToken, {
        type: LibraryType.EXTERNAL,
        importPaths: [`${IMMICH_TEST_ASSET_PATH}/albums/nature`],
      });
      await api.userApi.setExternalPath(server, admin.accessToken, admin.userId, '/');

      await api.libraryApi.scanLibrary(server, admin.accessToken, library.id);

      const assets = await api.assetApi.getAllAssets(server, admin.accessToken);
      expect(assets.length).toBeGreaterThan(2);

      const { status, body } = await request(server)
        .delete(`/library/${library.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual({});

      const libraries = await api.libraryApi.getAll(server, admin.accessToken);
      expect(libraries).toHaveLength(1);
      expect(libraries).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: library.id,
          }),
        ]),
      );
    });
  });

  describe('POST /library/:id/scan', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).post(`/library/${uuidStub.notFound}/scan`).send({});

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should scan external library with import paths', async () => {
      const library = await api.libraryApi.create(server, admin.accessToken, {
        type: LibraryType.EXTERNAL,
        importPaths: [`${IMMICH_TEST_ASSET_PATH}/albums/nature`],
      });
      await api.userApi.setExternalPath(server, admin.accessToken, admin.userId, '/');

      await api.libraryApi.scanLibrary(server, admin.accessToken, library.id);

      const assets = await api.assetApi.getAllAssets(server, admin.accessToken);

      expect(assets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: AssetType.IMAGE,
            originalFileName: 'el_torcal_rocks',
            libraryId: library.id,
            resized: true,
            thumbhash: expect.any(String),
            exifInfo: expect.objectContaining({
              exifImageWidth: 512,
              exifImageHeight: 341,
              latitude: null,
              longitude: null,
            }),
          }),
          expect.objectContaining({
            type: AssetType.IMAGE,
            originalFileName: 'silver_fir',
            libraryId: library.id,
            resized: true,
            thumbhash: expect.any(String),
            exifInfo: expect.objectContaining({
              exifImageWidth: 511,
              exifImageHeight: 323,
              latitude: null,
              longitude: null,
            }),
          }),
        ]),
      );
    });

    it('should scan external library with exclusion pattern', async () => {
      await api.userApi.setExternalPath(server, admin.accessToken, admin.userId, '/not/a/real/path');

      const library = await api.libraryApi.create(server, admin.accessToken, {
        type: LibraryType.EXTERNAL,
        importPaths: [`${IMMICH_TEST_ASSET_PATH}/albums/nature`],
        exclusionPatterns: ['**/el_corcal*'],
      });

      await api.userApi.setExternalPath(server, admin.accessToken, admin.userId, '/');

      await api.libraryApi.scanLibrary(server, admin.accessToken, library.id);

      const assets = await api.assetApi.getAllAssets(server, admin.accessToken);

      expect(assets).toEqual(
        expect.arrayContaining([
          expect.not.objectContaining({
            // Excluded by exclusion pattern
            originalFileName: 'el_torcal_rocks',
          }),
          expect.objectContaining({
            type: AssetType.IMAGE,
            originalFileName: 'silver_fir',
            libraryId: library.id,
            resized: true,
            exifInfo: expect.objectContaining({
              exifImageWidth: 511,
              exifImageHeight: 323,
              latitude: null,
              longitude: null,
            }),
          }),
        ]),
      );
    });

    it('should offline missing files', async () => {
      await fs.promises.cp(`${IMMICH_TEST_ASSET_PATH}/albums/nature`, `${IMMICH_TEST_ASSET_TEMP_PATH}/albums/nature`, {
        recursive: true,
      });

      const library = await api.libraryApi.create(server, admin.accessToken, {
        type: LibraryType.EXTERNAL,
        importPaths: [`${IMMICH_TEST_ASSET_TEMP_PATH}`],
      });
      await api.userApi.setExternalPath(server, admin.accessToken, admin.userId, '/');

      await api.libraryApi.scanLibrary(server, admin.accessToken, library.id);

      const onlineAssets = await api.assetApi.getAllAssets(server, admin.accessToken);
      expect(onlineAssets.length).toBeGreaterThan(1);

      await restoreTempFolder();

      await api.libraryApi.scanLibrary(server, admin.accessToken, library.id);

      const assets = await api.assetApi.getAllAssets(server, admin.accessToken);

      expect(assets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            isOffline: true,
            originalFileName: 'el_torcal_rocks',
          }),
          expect.objectContaining({
            isOffline: true,
            originalFileName: 'tanners_ridge',
          }),
        ]),
      );
    });

    it('should offline files outside of changed external path', async () => {
      const library = await api.libraryApi.create(server, admin.accessToken, {
        type: LibraryType.EXTERNAL,
        importPaths: [`${IMMICH_TEST_ASSET_PATH}/albums/nature`],
      });
      await api.userApi.setExternalPath(server, admin.accessToken, admin.userId, '/');
      await api.libraryApi.scanLibrary(server, admin.accessToken, library.id);

      await api.userApi.setExternalPath(server, admin.accessToken, admin.userId, '/some/other/path');
      await api.libraryApi.scanLibrary(server, admin.accessToken, library.id);

      const assets = await api.assetApi.getAllAssets(server, admin.accessToken);

      expect(assets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            isOffline: true,
            originalFileName: 'el_torcal_rocks',
          }),
          expect.objectContaining({
            isOffline: true,
            originalFileName: 'tanners_ridge',
          }),
        ]),
      );
    });

    it('should scan new files', async () => {
      const library = await api.libraryApi.create(server, admin.accessToken, {
        type: LibraryType.EXTERNAL,
        importPaths: [`${IMMICH_TEST_ASSET_TEMP_PATH}`],
      });
      await api.userApi.setExternalPath(server, admin.accessToken, admin.userId, '/');

      await fs.promises.cp(
        `${IMMICH_TEST_ASSET_PATH}/albums/nature/silver_fir.jpg`,
        `${IMMICH_TEST_ASSET_TEMP_PATH}/silver_fir.jpg`,
      );

      await api.libraryApi.scanLibrary(server, admin.accessToken, library.id);

      await fs.promises.cp(
        `${IMMICH_TEST_ASSET_PATH}/albums/nature/el_torcal_rocks.jpg`,
        `${IMMICH_TEST_ASSET_TEMP_PATH}/el_torcal_rocks.jpg`,
      );

      await api.libraryApi.scanLibrary(server, admin.accessToken, library.id);

      const assets = await api.assetApi.getAllAssets(server, admin.accessToken);

      expect(assets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            originalFileName: 'el_torcal_rocks',
          }),
          expect.objectContaining({
            originalFileName: 'silver_fir',
          }),
        ]),
      );
    });

    describe('with refreshModifiedFiles=true', () => {
      it('should reimport modified files', async () => {
        const library = await api.libraryApi.create(server, admin.accessToken, {
          type: LibraryType.EXTERNAL,
          importPaths: [`${IMMICH_TEST_ASSET_TEMP_PATH}`],
        });
        await api.userApi.setExternalPath(server, admin.accessToken, admin.userId, '/');

        await fs.promises.cp(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/el_torcal_rocks.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/el_torcal_rocks.jpg`,
        );

        await utimes(`${IMMICH_TEST_ASSET_TEMP_PATH}/el_torcal_rocks.jpg`, 447775200000);

        await api.libraryApi.scanLibrary(server, admin.accessToken, library.id);

        await fs.promises.cp(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/tanners_ridge.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/el_torcal_rocks.jpg`,
        );

        await utimes(`${IMMICH_TEST_ASSET_TEMP_PATH}/el_torcal_rocks.jpg`, 447775200001);

        await api.libraryApi.scanLibrary(server, admin.accessToken, library.id, { refreshModifiedFiles: true });

        const assets = await api.assetApi.getAllAssets(server, admin.accessToken);
        expect(assets.length).toBe(1);

        expect(assets[0]).toEqual(
          expect.objectContaining({
            originalFileName: 'el_torcal_rocks',
            exifInfo: expect.objectContaining({
              dateTimeOriginal: '2023-09-25T08:33:30.880Z',
              exifImageHeight: 534,
              exifImageWidth: 800,
              exposureTime: '1/15',
              fNumber: 22,
              fileSizeInByte: 114225,
              focalLength: 35,
              iso: 1000,
              make: 'NIKON CORPORATION',
              model: 'NIKON D750',
            }),
          }),
        );
      });

      it('should not reimport unmodified files', async () => {
        const library = await api.libraryApi.create(server, admin.accessToken, {
          type: LibraryType.EXTERNAL,
          importPaths: [`${IMMICH_TEST_ASSET_TEMP_PATH}`],
        });
        await api.userApi.setExternalPath(server, admin.accessToken, admin.userId, '/');

        await fs.promises.cp(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/el_torcal_rocks.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/el_torcal_rocks.jpg`,
        );

        await utimes(`${IMMICH_TEST_ASSET_TEMP_PATH}/el_torcal_rocks.jpg`, 447775200000);

        await api.libraryApi.scanLibrary(server, admin.accessToken, library.id);

        await fs.promises.cp(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/tanners_ridge.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/el_torcal_rocks.jpg`,
        );

        await utimes(`${IMMICH_TEST_ASSET_TEMP_PATH}/el_torcal_rocks.jpg`, 447775200000);

        await api.libraryApi.scanLibrary(server, admin.accessToken, library.id, { refreshModifiedFiles: true });

        const assets = await api.assetApi.getAllAssets(server, admin.accessToken);
        expect(assets.length).toBe(1);

        expect(assets[0]).toEqual(
          expect.objectContaining({
            originalFileName: 'el_torcal_rocks',
            exifInfo: expect.objectContaining({
              dateTimeOriginal: '2012-08-05T11:39:59.000Z',
            }),
          }),
        );
      });
    });

    describe('with refreshAllFiles=true', () => {
      it('should reimport all files', async () => {
        const library = await api.libraryApi.create(server, admin.accessToken, {
          type: LibraryType.EXTERNAL,
          importPaths: [`${IMMICH_TEST_ASSET_TEMP_PATH}`],
        });
        await api.userApi.setExternalPath(server, admin.accessToken, admin.userId, '/');

        await fs.promises.cp(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/el_torcal_rocks.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/el_torcal_rocks.jpg`,
        );

        await utimes(`${IMMICH_TEST_ASSET_TEMP_PATH}/el_torcal_rocks.jpg`, 447775200000);

        await api.libraryApi.scanLibrary(server, admin.accessToken, library.id);

        await fs.promises.cp(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/tanners_ridge.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/el_torcal_rocks.jpg`,
        );

        await utimes(`${IMMICH_TEST_ASSET_TEMP_PATH}/el_torcal_rocks.jpg`, 447775200000);

        await api.libraryApi.scanLibrary(server, admin.accessToken, library.id, { refreshAllFiles: true });

        const assets = await api.assetApi.getAllAssets(server, admin.accessToken);
        expect(assets.length).toBe(1);

        expect(assets[0]).toEqual(
          expect.objectContaining({
            originalFileName: 'el_torcal_rocks',
            exifInfo: expect.objectContaining({
              exifImageHeight: 534,
              exifImageWidth: 800,
              exposureTime: '1/15',
              fNumber: 22,
              fileSizeInByte: 114225,
              focalLength: 35,
              iso: 1000,
              make: 'NIKON CORPORATION',
              model: 'NIKON D750',
            }),
          }),
        );
      });
    });

    describe('External path', () => {
      let library: LibraryResponseDto;

      beforeEach(async () => {
        library = await api.libraryApi.create(server, admin.accessToken, {
          type: LibraryType.EXTERNAL,
          importPaths: [`${IMMICH_TEST_ASSET_PATH}/albums/nature`],
        });
      });

      it('should not scan assets for user without external path', async () => {
        await api.libraryApi.scanLibrary(server, admin.accessToken, library.id);
        const assets = await api.assetApi.getAllAssets(server, admin.accessToken);

        expect(assets).toEqual([]);
      });

      it("should not import assets outside of user's external path", async () => {
        await api.userApi.setExternalPath(server, admin.accessToken, admin.userId, '/not/a/real/path');
        await api.libraryApi.scanLibrary(server, admin.accessToken, library.id);

        const assets = await api.assetApi.getAllAssets(server, admin.accessToken);
        expect(assets).toEqual([]);
      });

      it.each([`${IMMICH_TEST_ASSET_PATH}/albums/nature`, `${IMMICH_TEST_ASSET_PATH}/albums/nature/`])(
        'should scan external library with external path %s',
        async (externalPath: string) => {
          await api.userApi.setExternalPath(server, admin.accessToken, admin.userId, externalPath);

          await api.libraryApi.scanLibrary(server, admin.accessToken, library.id);

          const assets = await api.assetApi.getAllAssets(server, admin.accessToken);

          expect(assets).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                type: AssetType.IMAGE,
                originalFileName: 'el_torcal_rocks',
                libraryId: library.id,
                resized: true,
                exifInfo: expect.objectContaining({
                  exifImageWidth: 512,
                  exifImageHeight: 341,
                  latitude: null,
                  longitude: null,
                }),
              }),
              expect.objectContaining({
                type: AssetType.IMAGE,
                originalFileName: 'silver_fir',
                libraryId: library.id,
                resized: true,
                exifInfo: expect.objectContaining({
                  exifImageWidth: 511,
                  exifImageHeight: 323,
                  latitude: null,
                  longitude: null,
                }),
              }),
            ]),
          );
        },
      );
    });

    it('should not scan an upload library', async () => {
      const library = await api.libraryApi.create(server, admin.accessToken, {
        type: LibraryType.UPLOAD,
      });

      const { status, body } = await request(server)
        .post(`/library/${library.id}/scan`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest('Can only refresh external libraries'));
    });
  });

  describe('POST /library/:id/removeOffline', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).post(`/library/${uuidStub.notFound}/removeOffline`).send({});

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should remvove offline files', async () => {
      await fs.promises.cp(`${IMMICH_TEST_ASSET_PATH}/albums/nature`, `${IMMICH_TEST_ASSET_TEMP_PATH}/albums/nature`, {
        recursive: true,
      });

      const library = await api.libraryApi.create(server, admin.accessToken, {
        type: LibraryType.EXTERNAL,
        importPaths: [`${IMMICH_TEST_ASSET_TEMP_PATH}`],
      });
      await api.userApi.setExternalPath(server, admin.accessToken, admin.userId, '/');

      await api.libraryApi.scanLibrary(server, admin.accessToken, library.id);

      const onlineAssets = await api.assetApi.getAllAssets(server, admin.accessToken);
      expect(onlineAssets.length).toBeGreaterThan(1);

      await restoreTempFolder();

      await api.libraryApi.scanLibrary(server, admin.accessToken, library.id);

      const { status } = await request(server)
        .post(`/library/${library.id}/removeOffline`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send();
      expect(status).toBe(201);

      const assets = await api.assetApi.getAllAssets(server, admin.accessToken);

      expect(assets).toEqual([]);
    });

    it('should not remvove online files', async () => {
      const library = await api.libraryApi.create(server, admin.accessToken, {
        type: LibraryType.EXTERNAL,
        importPaths: [`${IMMICH_TEST_ASSET_PATH}/albums/nature`],
      });
      await api.userApi.setExternalPath(server, admin.accessToken, admin.userId, '/');

      await api.libraryApi.scanLibrary(server, admin.accessToken, library.id);

      const assetsBefore = await api.assetApi.getAllAssets(server, admin.accessToken);
      expect(assetsBefore.length).toBeGreaterThan(1);

      await api.libraryApi.scanLibrary(server, admin.accessToken, library.id);

      const { status } = await request(server)
        .post(`/library/${library.id}/removeOffline`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send();
      expect(status).toBe(201);

      const assetsAfter = await api.assetApi.getAllAssets(server, admin.accessToken);

      expect(assetsAfter).toEqual(assetsBefore);
    });
  });
});
