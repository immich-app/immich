import { LoginResponseDto } from '@immich/sdk';
import { cpSync } from 'node:fs';
import { Socket } from 'socket.io-client';
import { testAssetDir, testAssetDirInternal, utils } from 'src/utils';
import { utimes } from 'utimes';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('/libraries', () => {
  let admin: LoginResponseDto;
  let websocket: Socket;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    await utils.resetAdminConfig(admin.accessToken);
    websocket = await utils.connectWebsocket(admin.accessToken);
    utils.createImageFile(`${testAssetDir}/temp/directoryA/assetA.png`);
  });

  afterAll(() => {
    utils.disconnectWebsocket(websocket);
    utils.resetTempFolder();
  });

  beforeEach(() => {
    utils.resetEvents();
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
});
