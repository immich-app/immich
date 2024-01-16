import { LibraryResponseDto, LoginResponseDto } from '@app/domain';
import { AssetType, LibraryType } from '@app/infra/entities';
import * as fs from 'fs';

import { api } from '../client';
import { IMMICH_TEST_ASSET_PATH, IMMICH_TEST_ASSET_TEMP_PATH, jobMock, restoreTempFolder, testApp } from '../utils';

describe(`Library watcher (e2e)`, () => {
  let server: any;
  let admin: LoginResponseDto;

  beforeAll(async () => {
    server = (await testApp.create({ jobs: true })).getHttpServer();
  });

  beforeEach(async () => {
    await testApp.reset();
    await restoreTempFolder();
    await api.authApi.adminSignUp(server);
    admin = await api.authApi.adminLogin(server);

    await api.userApi.setExternalPath(server, admin.accessToken, admin.userId, '/');
  });

  afterEach(async () => {
    await testApp.stopWatcher();
  });

  afterAll(async () => {
    await testApp.teardown();
    await restoreTempFolder();
  });

  describe('Event handling', () => {
    let library: LibraryResponseDto;

    describe('Single import path', () => {
      beforeEach(async () => {
        library = await api.libraryApi.create(server, admin.accessToken, {
          type: LibraryType.EXTERNAL,
          importPaths: [`${IMMICH_TEST_ASSET_TEMP_PATH}`],
        });

        await api.libraryApi.watch(server, admin.accessToken, library.id);
      });

      it('should import a new file', async () => {
        await fs.promises.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/el_torcal_rocks.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/file.jpg`,
        );

        function delay(ms: number) {
          return new Promise((resolve) => setTimeout(resolve, ms));
        }

        await delay(3000);

        const afterAssets = await api.assetApi.getAllAssets(server, admin.accessToken);
        expect(afterAssets.length).toEqual(1);
      });

      it('should import new files with case insensitive extensions', async () => {
        await fs.promises.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/el_torcal_rocks.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/file2.JPG`,
        );

        await fs.promises.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/el_torcal_rocks.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/file3.Jpg`,
        );

        await fs.promises.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/el_torcal_rocks.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/file4.jpG`,
        );

        await fs.promises.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/el_torcal_rocks.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/file5.jPg`,
        );

        function delay(ms: number) {
          return new Promise((resolve) => setTimeout(resolve, ms));
        }

        await delay(3000);

        const afterAssets = await api.assetApi.getAllAssets(server, admin.accessToken);
        expect(afterAssets.length).toEqual(4);
      });

      it('should ignore files with wrong extensions', async () => {
        jest.clearAllMocks();

        await fs.promises.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/el_torcal_rocks.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/file2.txt`,
        );

        await fs.promises.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/el_torcal_rocks.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/file3.TXT`,
        );

        await fs.promises.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/el_torcal_rocks.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/file4.TxT`,
        );

        function delay(ms: number) {
          return new Promise((resolve) => setTimeout(resolve, ms));
        }

        await delay(3000);

        const afterAssets = await api.assetApi.getAllAssets(server, admin.accessToken);
        expect(afterAssets.length).toEqual(0);

        expect(jobMock.queue).not.toHaveBeenCalled();
      });

      it('should update a changed file', async () => {
        await fs.promises.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/el_torcal_rocks.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/file.jpg`,
        );

        function delay(ms: number) {
          return new Promise((resolve) => setTimeout(resolve, ms));
        }

        await delay(3000);

        const originalAssets = await api.assetApi.getAllAssets(server, admin.accessToken);
        expect(originalAssets.length).toEqual(1);

        await fs.promises.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/prairie_falcon.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/file.jpg`,
        );

        await delay(3000);

        const afterAssets = await api.assetApi.getAllAssets(server, admin.accessToken);
        expect(afterAssets).toEqual([
          expect.objectContaining({
            // Make sure we keep the original asset id
            id: originalAssets[0].id,
            type: AssetType.IMAGE,
            exifInfo: expect.objectContaining({
              make: 'Canon',
              model: 'Canon EOS R5',
              exifImageWidth: 800,
              exifImageHeight: 533,
              exposureTime: '1/4000',
            }),
          }),
        ]);
      });
    });

    describe('Multiple import paths', () => {
      beforeEach(async () => {
        library = await api.libraryApi.create(server, admin.accessToken, {
          type: LibraryType.EXTERNAL,
          importPaths: [
            `${IMMICH_TEST_ASSET_TEMP_PATH}/dir1`,
            `${IMMICH_TEST_ASSET_TEMP_PATH}/dir2`,
            `${IMMICH_TEST_ASSET_TEMP_PATH}/dir3`,
          ],
        });

        await fs.promises.mkdir(`${IMMICH_TEST_ASSET_TEMP_PATH}/dir1`, { recursive: true });
        await fs.promises.mkdir(`${IMMICH_TEST_ASSET_TEMP_PATH}/dir2`, { recursive: true });
        await fs.promises.mkdir(`${IMMICH_TEST_ASSET_TEMP_PATH}/dir3`, { recursive: true });

        await api.libraryApi.watch(server, admin.accessToken, library.id);
      });

      it('should ignore excluded paths', async () => {
        await api.libraryApi.setExclusionPatterns(server, admin.accessToken, library.id, ['**/dir2/**']);

        jest.clearAllMocks();

        await fs.promises.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/polemonium_reptans.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/dir2/file2.jpg`,
        );

        function delay(ms: number) {
          return new Promise((resolve) => setTimeout(resolve, ms));
        }

        await delay(3000);

        expect(jobMock.queue).not.toHaveBeenCalled();

        const afterAssets = await api.assetApi.getAllAssets(server, admin.accessToken);
        expect(afterAssets.length).toEqual(0);
      });

      it('should ignore excluded paths without case sensitivity', async () => {
        await api.libraryApi.setExclusionPatterns(server, admin.accessToken, library.id, ['**/DIR2/**']);

        jest.clearAllMocks();

        await fs.promises.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/polemonium_reptans.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/dir2/file2.jpg`,
        );

        function delay(ms: number) {
          return new Promise((resolve) => setTimeout(resolve, ms));
        }

        await delay(3000);

        expect(jobMock.queue).not.toHaveBeenCalled();

        const afterAssets = await api.assetApi.getAllAssets(server, admin.accessToken);
        expect(afterAssets.length).toEqual(0);
      });

      it('should add new files in multiple import paths', async () => {
        await fs.promises.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/el_torcal_rocks.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/dir1/file2.jpg`,
        );

        await fs.promises.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/polemonium_reptans.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/dir2/file3.jpg`,
        );

        await fs.promises.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/tanners_ridge.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/dir3/file4.jpg`,
        );

        function delay(ms: number) {
          return new Promise((resolve) => setTimeout(resolve, ms));
        }

        await delay(3000);

        const afterAssets = await api.assetApi.getAllAssets(server, admin.accessToken);
        expect(afterAssets.length).toEqual(3);
      });

      it('should offline a removed file', async () => {
        function delay(ms: number) {
          return new Promise((resolve) => setTimeout(resolve, ms));
        }

        await fs.promises.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/polemonium_reptans.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/dir1/file.jpg`,
        );

        await delay(3000);

        const addedAssets = await api.assetApi.getAllAssets(server, admin.accessToken);
        expect(addedAssets.length).toEqual(1);

        await fs.promises.unlink(`${IMMICH_TEST_ASSET_TEMP_PATH}/dir1/file.jpg`);

        await delay(3000);

        const afterAssets = await api.assetApi.getAllAssets(server, admin.accessToken);
        expect(afterAssets[0].isOffline).toEqual(true);
      });
    });
  });

  describe('Configuration', () => {
    let library: LibraryResponseDto;

    beforeEach(async () => {
      library = await api.libraryApi.create(server, admin.accessToken, {
        type: LibraryType.EXTERNAL,
        importPaths: [
          `${IMMICH_TEST_ASSET_TEMP_PATH}/dir1`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/dir2`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/dir3`,
        ],
      });

      await api.userApi.setExternalPath(server, admin.accessToken, admin.userId, '/');

      await fs.promises.mkdir(`${IMMICH_TEST_ASSET_TEMP_PATH}/dir1`, { recursive: true });
      await fs.promises.mkdir(`${IMMICH_TEST_ASSET_TEMP_PATH}/dir2`, { recursive: true });
      await fs.promises.mkdir(`${IMMICH_TEST_ASSET_TEMP_PATH}/dir3`, { recursive: true });

      await api.libraryApi.watch(server, admin.accessToken, library.id);
    });

    it('should use updated import paths', async () => {
      await fs.promises.mkdir(`${IMMICH_TEST_ASSET_TEMP_PATH}/dir4`, { recursive: true });

      await api.libraryApi.setImportPaths(server, admin.accessToken, library.id, [
        `${IMMICH_TEST_ASSET_TEMP_PATH}/dir4`,
      ]);

      function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }

      await fs.promises.copyFile(
        `${IMMICH_TEST_ASSET_PATH}/albums/nature/polemonium_reptans.jpg`,
        `${IMMICH_TEST_ASSET_TEMP_PATH}/dir4/file2.jpg`,
      );

      await delay(3000);

      const afterAssets = await api.assetApi.getAllAssets(server, admin.accessToken);
      expect(afterAssets.length).toEqual(1);
    });

    // TODO: check what happens when importpaths are modified

    it('should stop watching library when deleted', async () => {
      await api.libraryApi.deleteLibrary(server, admin.accessToken, library.id);

      jest.clearAllMocks();

      await fs.promises.copyFile(
        `${IMMICH_TEST_ASSET_PATH}/albums/nature/polemonium_reptans.jpg`,
        `${IMMICH_TEST_ASSET_TEMP_PATH}/dir2/file2.jpg`,
      );

      function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }

      await delay(3000);

      expect(jobMock.queue).not.toHaveBeenCalled();
    });
  });
});
