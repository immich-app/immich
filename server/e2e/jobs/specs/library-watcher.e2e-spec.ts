import { LibraryResponseDto, LibraryService, LoginResponseDto } from '@app/domain';
import { AssetType, LibraryType } from '@app/infra/entities';
import fs from 'fs/promises';
import path from 'path';
import {
  IMMICH_TEST_ASSET_PATH,
  IMMICH_TEST_ASSET_TEMP_PATH,
  restoreTempFolder,
  testApp,
  waitForEvent,
} from '../../../src/test-utils/utils';
import { api } from '../../client';

describe(`Library watcher (e2e)`, () => {
  let server: any;
  let admin: LoginResponseDto;
  let libraryService: LibraryService;
  const configFilePath = process.env.IMMICH_CONFIG_FILE;

  beforeAll(async () => {
    process.env.IMMICH_CONFIG_FILE = path.normalize(`${__dirname}/../config/library-watcher-e2e-config.json`);

    server = (await testApp.create()).getHttpServer();
    libraryService = testApp.get(LibraryService);
  });

  beforeEach(async () => {
    await testApp.reset();
    await restoreTempFolder();
    await api.authApi.adminSignUp(server);
    admin = await api.authApi.adminLogin(server);

    await api.userApi.setExternalPath(server, admin.accessToken, admin.userId, '/');
  });

  afterEach(async () => {
    await libraryService.unwatchAll();
  });

  afterAll(async () => {
    await testApp.teardown();
    await restoreTempFolder();
    process.env.IMMICH_CONFIG_FILE = configFilePath;
  });

  describe('Event handling', () => {
    describe('Single import path', () => {
      beforeEach(async () => {
        await api.libraryApi.create(server, admin.accessToken, {
          type: LibraryType.EXTERNAL,
          importPaths: [`${IMMICH_TEST_ASSET_TEMP_PATH}`],
        });
      });

      it('should import a new file', async () => {
        await fs.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/el_torcal_rocks.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/file.jpg`,
        );

        await waitForEvent(libraryService, 'add');

        const afterAssets = await api.assetApi.getAllAssets(server, admin.accessToken);
        expect(afterAssets.length).toEqual(1);
      });

      it('should import new files with case insensitive extensions', async () => {
        await fs.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/el_torcal_rocks.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/file2.JPG`,
        );

        await fs.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/el_torcal_rocks.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/file3.Jpg`,
        );

        await fs.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/el_torcal_rocks.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/file4.jpG`,
        );

        await fs.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/el_torcal_rocks.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/file5.jPg`,
        );

        await waitForEvent(libraryService, 'add');
        await waitForEvent(libraryService, 'add');
        await waitForEvent(libraryService, 'add');
        await waitForEvent(libraryService, 'add');

        const afterAssets = await api.assetApi.getAllAssets(server, admin.accessToken);
        expect(afterAssets.length).toEqual(4);
      });

      it('should update a changed file', async () => {
        await fs.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/el_torcal_rocks.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/file.jpg`,
        );

        await waitForEvent(libraryService, 'add');

        const originalAssets = await api.assetApi.getAllAssets(server, admin.accessToken);
        expect(originalAssets.length).toEqual(1);

        await fs.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/prairie_falcon.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/file.jpg`,
        );

        await waitForEvent(libraryService, 'change');

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
        await fs.mkdir(`${IMMICH_TEST_ASSET_TEMP_PATH}/dir1`, { recursive: true });
        await fs.mkdir(`${IMMICH_TEST_ASSET_TEMP_PATH}/dir2`, { recursive: true });
        await fs.mkdir(`${IMMICH_TEST_ASSET_TEMP_PATH}/dir3`, { recursive: true });

        await api.libraryApi.create(server, admin.accessToken, {
          type: LibraryType.EXTERNAL,
          importPaths: [
            `${IMMICH_TEST_ASSET_TEMP_PATH}/dir1`,
            `${IMMICH_TEST_ASSET_TEMP_PATH}/dir2`,
            `${IMMICH_TEST_ASSET_TEMP_PATH}/dir3`,
          ],
        });
      });

      it('should add new files in multiple import paths', async () => {
        await fs.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/el_torcal_rocks.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/dir1/file2.jpg`,
        );

        await fs.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/polemonium_reptans.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/dir2/file3.jpg`,
        );

        await fs.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/tanners_ridge.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/dir3/file4.jpg`,
        );

        await waitForEvent(libraryService, 'add');
        await waitForEvent(libraryService, 'add');
        await waitForEvent(libraryService, 'add');

        const assets = await api.assetApi.getAllAssets(server, admin.accessToken);
        expect(assets.length).toEqual(3);
      });

      it('should offline a removed file', async () => {
        await fs.copyFile(
          `${IMMICH_TEST_ASSET_PATH}/albums/nature/polemonium_reptans.jpg`,
          `${IMMICH_TEST_ASSET_TEMP_PATH}/dir1/file.jpg`,
        );

        await waitForEvent(libraryService, 'add');

        const addedAssets = await api.assetApi.getAllAssets(server, admin.accessToken);
        expect(addedAssets.length).toEqual(1);

        await fs.unlink(`${IMMICH_TEST_ASSET_TEMP_PATH}/dir1/file.jpg`);

        await waitForEvent(libraryService, 'unlink');

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

      await fs.mkdir(`${IMMICH_TEST_ASSET_TEMP_PATH}/dir1`, { recursive: true });
      await fs.mkdir(`${IMMICH_TEST_ASSET_TEMP_PATH}/dir2`, { recursive: true });
      await fs.mkdir(`${IMMICH_TEST_ASSET_TEMP_PATH}/dir3`, { recursive: true });
    });

    it('should use an updated import paths', async () => {
      await fs.mkdir(`${IMMICH_TEST_ASSET_TEMP_PATH}/dir4`, { recursive: true });

      await api.libraryApi.setImportPaths(server, admin.accessToken, library.id, [
        `${IMMICH_TEST_ASSET_TEMP_PATH}/dir4`,
      ]);

      await fs.copyFile(
        `${IMMICH_TEST_ASSET_PATH}/albums/nature/polemonium_reptans.jpg`,
        `${IMMICH_TEST_ASSET_TEMP_PATH}/dir4/file.jpg`,
      );

      await waitForEvent(libraryService, 'add');

      const afterAssets = await api.assetApi.getAllAssets(server, admin.accessToken);
      expect(afterAssets.length).toEqual(1);
    });
  });
});
