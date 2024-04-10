import { api } from 'e2e/client';
import fs from 'node:fs';
import { LibraryController } from 'src/controllers/library.controller';
import { LoginResponseDto } from 'src/dtos/auth.dto';
import { LibraryType } from 'src/entities/library.entity';
import request from 'supertest';
import { errorStub } from 'test/fixtures/error.stub';
import { uuidStub } from 'test/fixtures/uuid.stub';
import { IMMICH_TEST_ASSET_PATH, IMMICH_TEST_ASSET_TEMP_PATH, restoreTempFolder, testApp } from 'test/utils';
import { utimes } from 'utimes';

describe(`${LibraryController.name} (e2e)`, () => {
  let server: any;
  let admin: LoginResponseDto;

  beforeAll(async () => {
    const app = await testApp.create();
    server = app.getHttpServer();
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

  describe('POST /library/:id/scan', () => {
    it('should scan new files', async () => {
      const library = await api.libraryApi.create(server, admin.accessToken, {
        ownerId: admin.userId,
        type: LibraryType.EXTERNAL,
        importPaths: [`${IMMICH_TEST_ASSET_TEMP_PATH}`],
      });

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
            originalFileName: 'el_torcal_rocks.jpg',
          }),
          expect.objectContaining({
            originalFileName: 'silver_fir.jpg',
          }),
        ]),
      );
    });

    describe('with refreshModifiedFiles=true', () => {
      it('should reimport modified files', async () => {
        const library = await api.libraryApi.create(server, admin.accessToken, {
          ownerId: admin.userId,
          type: LibraryType.EXTERNAL,
          importPaths: [`${IMMICH_TEST_ASSET_TEMP_PATH}`],
        });

        await fs.promises.cp(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/el_torcal_rocks.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/el_torcal_rocks.jpg`,
        );

        await utimes(`${IMMICH_TEST_ASSET_TEMP_PATH}/el_torcal_rocks.jpg`, 447_775_200_000);

        await api.libraryApi.scanLibrary(server, admin.accessToken, library.id);

        await fs.promises.cp(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/tanners_ridge.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/el_torcal_rocks.jpg`,
        );

        await utimes(`${IMMICH_TEST_ASSET_TEMP_PATH}/el_torcal_rocks.jpg`, 447_775_200_001);

        await api.libraryApi.scanLibrary(server, admin.accessToken, library.id, { refreshModifiedFiles: true });

        const assets = await api.assetApi.getAllAssets(server, admin.accessToken);
        expect(assets.length).toBe(1);

        expect(assets[0]).toEqual(
          expect.objectContaining({
            originalFileName: 'el_torcal_rocks.jpg',
            exifInfo: expect.objectContaining({
              dateTimeOriginal: '2023-09-25T08:33:30.880Z',
              exifImageHeight: 534,
              exifImageWidth: 800,
              exposureTime: '1/15',
              fNumber: 22,
              fileSizeInByte: 114_225,
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
          ownerId: admin.userId,
          type: LibraryType.EXTERNAL,
          importPaths: [`${IMMICH_TEST_ASSET_TEMP_PATH}`],
        });

        await fs.promises.cp(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/el_torcal_rocks.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/el_torcal_rocks.jpg`,
        );

        await utimes(`${IMMICH_TEST_ASSET_TEMP_PATH}/el_torcal_rocks.jpg`, 447_775_200_000);

        await api.libraryApi.scanLibrary(server, admin.accessToken, library.id);

        await fs.promises.cp(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/tanners_ridge.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/el_torcal_rocks.jpg`,
        );

        await utimes(`${IMMICH_TEST_ASSET_TEMP_PATH}/el_torcal_rocks.jpg`, 447_775_200_000);

        await api.libraryApi.scanLibrary(server, admin.accessToken, library.id, { refreshModifiedFiles: true });

        const assets = await api.assetApi.getAllAssets(server, admin.accessToken);
        expect(assets.length).toBe(1);

        expect(assets[0]).toEqual(
          expect.objectContaining({
            originalFileName: 'el_torcal_rocks.jpg',
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
          ownerId: admin.userId,
          type: LibraryType.EXTERNAL,
          importPaths: [`${IMMICH_TEST_ASSET_TEMP_PATH}`],
        });

        await fs.promises.cp(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/el_torcal_rocks.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/el_torcal_rocks.jpg`,
        );

        await utimes(`${IMMICH_TEST_ASSET_TEMP_PATH}/el_torcal_rocks.jpg`, 447_775_200_000);

        await api.libraryApi.scanLibrary(server, admin.accessToken, library.id);

        await fs.promises.cp(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/tanners_ridge.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/el_torcal_rocks.jpg`,
        );

        await utimes(`${IMMICH_TEST_ASSET_TEMP_PATH}/el_torcal_rocks.jpg`, 447_775_200_000);

        await api.libraryApi.scanLibrary(server, admin.accessToken, library.id, { refreshAllFiles: true });

        const assets = await api.assetApi.getAllAssets(server, admin.accessToken);
        expect(assets.length).toBe(1);

        expect(assets[0]).toEqual(
          expect.objectContaining({
            originalFileName: 'el_torcal_rocks.jpg',
            exifInfo: expect.objectContaining({
              exifImageHeight: 534,
              exifImageWidth: 800,
              exposureTime: '1/15',
              fNumber: 22,
              fileSizeInByte: 114_225,
              focalLength: 35,
              iso: 1000,
              make: 'NIKON CORPORATION',
              model: 'NIKON D750',
            }),
          }),
        );
      });
    });
  });

  describe('POST /library/:id/removeOffline', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).post(`/library/${uuidStub.notFound}/removeOffline`).send({});

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should remove offline files', async () => {
      await fs.promises.cp(`${IMMICH_TEST_ASSET_PATH}/albums/nature`, `${IMMICH_TEST_ASSET_TEMP_PATH}/albums/nature`, {
        recursive: true,
      });

      const library = await api.libraryApi.create(server, admin.accessToken, {
        ownerId: admin.userId,
        type: LibraryType.EXTERNAL,
        importPaths: [`${IMMICH_TEST_ASSET_TEMP_PATH}`],
      });

      await api.libraryApi.scanLibrary(server, admin.accessToken, library.id);

      const onlineAssets = await api.assetApi.getAllAssets(server, admin.accessToken);
      expect(onlineAssets.length).toBeGreaterThan(1);

      await restoreTempFolder();

      await api.libraryApi.scanLibrary(server, admin.accessToken, library.id);

      const { status } = await request(server)
        .post(`/library/${library.id}/removeOffline`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send();
      expect(status).toBe(204);

      const assets = await api.assetApi.getAllAssets(server, admin.accessToken);

      expect(assets).toEqual([]);
    });

    it('should not remove online files', async () => {
      const library = await api.libraryApi.create(server, admin.accessToken, {
        ownerId: admin.userId,
        type: LibraryType.EXTERNAL,
        importPaths: [`${IMMICH_TEST_ASSET_PATH}/albums/nature`],
      });

      await api.libraryApi.scanLibrary(server, admin.accessToken, library.id);

      const assetsBefore = await api.assetApi.getAllAssets(server, admin.accessToken);
      expect(assetsBefore.length).toBeGreaterThan(1);

      await api.libraryApi.scanLibrary(server, admin.accessToken, library.id);

      const { status } = await request(server)
        .post(`/library/${library.id}/removeOffline`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send();
      expect(status).toBe(204);

      const assetsAfter = await api.assetApi.getAllAssets(server, admin.accessToken);

      expect(assetsAfter).toEqual(assetsBefore);
    });
  });
});
