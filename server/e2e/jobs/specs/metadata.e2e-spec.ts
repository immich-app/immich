import { AssetResponseDto, LoginResponseDto } from '@app/domain';
import { AssetController } from '@app/immich';
import { exiftool } from 'exiftool-vendored';
import { readFile, writeFile } from 'fs/promises';
import {
  IMMICH_TEST_ASSET_PATH,
  IMMICH_TEST_ASSET_TEMP_PATH,
  db,
  restoreTempFolder,
  testApp,
} from '../../../src/test-utils/utils';
import { api } from '../../client';

describe(`${AssetController.name} (e2e)`, () => {
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

  describe('should strip metadata of', () => {
    let assetWithLocation: AssetResponseDto;

    beforeEach(async () => {
      const fileContent = await readFile(`${IMMICH_TEST_ASSET_PATH}/metadata/gps-position/thompson-springs.jpg`);

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

    it('small webp thumbnails', async () => {
      const assetId = assetWithLocation.id;

      const thumbnail = await api.assetApi.getWebpThumbnail(server, admin.accessToken, assetId);

      await writeFile(`${IMMICH_TEST_ASSET_TEMP_PATH}/thumbnail.webp`, thumbnail);

      const exifData = await exiftool.read(`${IMMICH_TEST_ASSET_TEMP_PATH}/thumbnail.webp`);

      expect(exifData).not.toHaveProperty('GPSLongitude');
      expect(exifData).not.toHaveProperty('GPSLatitude');
    });

    it('large jpeg thumbnails', async () => {
      const assetId = assetWithLocation.id;

      const thumbnail = await api.assetApi.getJpegThumbnail(server, admin.accessToken, assetId);

      await writeFile(`${IMMICH_TEST_ASSET_TEMP_PATH}/thumbnail.jpg`, thumbnail);

      const exifData = await exiftool.read(`${IMMICH_TEST_ASSET_TEMP_PATH}/thumbnail.jpg`);

      expect(exifData).not.toHaveProperty('GPSLongitude');
      expect(exifData).not.toHaveProperty('GPSLatitude');
    });
  });

  describe.each([
    // These hashes were created by copying the image files to a Samsung phone,
    // exporting the video from Samsung's stock Gallery app, and hashing them locally.
    // This ensures that immich+exiftool are extracting the videos the same way Samsung does.
    // DO NOT assume immich+exiftool are doing things correctly and just copy whatever hash it gives
    // into the test here.
    ['Samsung One UI 5.jpg', 'fr14niqCq6N20HB8rJYEvpsUVtI='],
    ['Samsung One UI 6.jpg', 'lT9Uviw/FFJYCjfIxAGPTjzAmmw='],
    ['Samsung One UI 6.heic', '/ejgzywvgvzvVhUYVfvkLzFBAF0='],
  ])('should extract motionphoto video', (file, checksum) => {
    it(`with checksum ${checksum} from ${file}`, async () => {
      const fileContent = await readFile(`${IMMICH_TEST_ASSET_PATH}/formats/motionphoto/${file}`);

      const response = await api.assetApi.upload(server, admin.accessToken, 'test-asset-id', { content: fileContent });
      const asset = await api.assetApi.get(server, admin.accessToken, response.id);
      expect(asset).toHaveProperty('livePhotoVideoId');
      const video = await api.assetApi.get(server, admin.accessToken, asset.livePhotoVideoId as string);

      expect(video.checksum).toStrictEqual(checksum);
    });
  });
});
