import { AssetResponseDto, LoginResponseDto } from '@app/domain';
import { AssetController } from '@app/immich';
import { INestApplication } from '@nestjs/common';
import { exiftool } from 'exiftool-vendored';
import * as fs from 'fs';
import { api } from '../client';
import {
  IMMICH_TEST_ASSET_PATH,
  IMMICH_TEST_ASSET_TEMP_PATH,
  db,
  itif,
  restoreTempFolder,
  runAllTests,
  testApp,
} from '../utils';

describe(`${AssetController.name} (e2e)`, () => {
  let app: INestApplication;
  let server: any;
  let admin: LoginResponseDto;

  beforeAll(async () => {
    app = await testApp.create({ jobs: true });
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await db.reset();
    await restoreTempFolder();
    await api.authApi.adminSignUp(server);
    admin = await api.authApi.adminLogin(server);
  });

  afterAll(async () => {
    await testApp.teardown();
    await restoreTempFolder();
  });

  describe.only('should strip metadata of', () => {
    let assetWithLocation: AssetResponseDto;

    beforeEach(async () => {
      const fileContent = await fs.promises.readFile(
        `${IMMICH_TEST_ASSET_PATH}/metadata/gps-position/thompson-springs.jpg`,
      );

      await api.assetApi.upload(server, admin.accessToken, 'test-asset-id', { content: fileContent });

      const assets = await api.assetApi.getAllAssets(server, admin.accessToken);

      expect(assets).toHaveLength(1);
      assetWithLocation = assets[0];

      expect(assetWithLocation).toEqual(
        expect.objectContaining({
          exifInfo: expect.objectContaining({ latitude: 39.115, longitude: -108.400968333333 }),
        }),
      );
    });

    itif(runAllTests)('small webp thumbnails', async () => {
      const assetId = assetWithLocation.id;

      const thumbnail = await api.assetApi.getWebpThumbnail(server, admin.accessToken, assetId);

      await fs.promises.writeFile(`${IMMICH_TEST_ASSET_TEMP_PATH}/thumbnail.webp`, thumbnail);

      const exifData = await exiftool.read(`${IMMICH_TEST_ASSET_TEMP_PATH}/thumbnail.webp`);

      expect(exifData).not.toHaveProperty('GPSLongitude');
      expect(exifData).not.toHaveProperty('GPSLatitude');
    });

    itif(runAllTests)('large jpeg thumbnails', async () => {
      const assetId = assetWithLocation.id;

      const thumbnail = await api.assetApi.getJpegThumbnail(server, admin.accessToken, assetId);

      await fs.promises.writeFile(`${IMMICH_TEST_ASSET_TEMP_PATH}/thumbnail.jpg`, thumbnail);

      const exifData = await exiftool.read(`${IMMICH_TEST_ASSET_TEMP_PATH}/thumbnail.jpg`);

      expect(exifData).not.toHaveProperty('GPSLongitude');
      expect(exifData).not.toHaveProperty('GPSLatitude');
    });
  });
});
