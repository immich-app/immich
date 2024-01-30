import { LoginResponseDto } from '@app/domain';
import { AssetType } from '@app/infra/entities';
import { readFile } from 'fs/promises';
import { basename, join } from 'path';
import { IMMICH_TEST_ASSET_PATH, testApp } from '../../../src/test-utils/utils';
import { api } from '../../client';

const JPEG = {
  type: AssetType.IMAGE,
  originalFileName: 'el_torcal_rocks',
  resized: true,
  exifInfo: {
    dateTimeOriginal: '2012-08-05T11:39:59.000Z',
    exifImageWidth: 512,
    exifImageHeight: 341,
    latitude: null,
    longitude: null,
    focalLength: 75,
    iso: 200,
    fNumber: 11,
    exposureTime: '1/160',
    fileSizeInByte: 53493,
    make: 'SONY',
    model: 'DSLR-A550',
    orientation: null,
    description: 'SONY DSC',
  },
};

const tests = [
  { input: 'formats/jpg/el_torcal_rocks.jpg', expected: JPEG },
  { input: 'formats/jpeg/el_torcal_rocks.jpeg', expected: JPEG },
  {
    input: 'formats/heic/IMG_2682.heic',
    expected: {
      type: AssetType.IMAGE,
      originalFileName: 'IMG_2682',
      resized: true,
      fileCreatedAt: '2019-03-21T16:04:22.348Z',
      exifInfo: {
        dateTimeOriginal: '2019-03-21T16:04:22.348Z',
        exifImageWidth: 4032,
        exifImageHeight: 3024,
        latitude: 41.2203,
        longitude: -96.071625,
        make: 'Apple',
        model: 'iPhone 7',
        lensModel: 'iPhone 7 back camera 3.99mm f/1.8',
        fileSizeInByte: 880703,
        exposureTime: '1/887',
        iso: 20,
        focalLength: 3.99,
        fNumber: 1.8,
        timeZone: 'America/Chicago',
      },
    },
  },
  {
    input: 'formats/png/density_plot.png',
    expected: {
      type: AssetType.IMAGE,
      originalFileName: 'density_plot',
      resized: true,
      exifInfo: {
        exifImageWidth: 800,
        exifImageHeight: 800,
        latitude: null,
        longitude: null,
        fileSizeInByte: 25408,
      },
    },
  },
  {
    input: 'formats/raw/Nikon/D80/glarus.nef',
    expected: {
      type: AssetType.IMAGE,
      originalFileName: 'glarus',
      resized: true,
      fileCreatedAt: '2010-07-20T17:27:12.000Z',
      exifInfo: {
        make: 'NIKON CORPORATION',
        model: 'NIKON D80',
        exposureTime: '1/200',
        fNumber: 10,
        focalLength: 18,
        iso: 100,
        fileSizeInByte: 9057784,
        dateTimeOriginal: '2010-07-20T17:27:12.000Z',
        latitude: null,
        longitude: null,
        orientation: '1',
      },
    },
  },
  {
    input: 'formats/raw/Nikon/D700/philadelphia.nef',
    expected: {
      type: AssetType.IMAGE,
      originalFileName: 'philadelphia',
      resized: true,
      fileCreatedAt: '2016-09-22T22:10:29.060Z',
      exifInfo: {
        make: 'NIKON CORPORATION',
        model: 'NIKON D700',
        exposureTime: '1/400',
        fNumber: 11,
        focalLength: 85,
        iso: 200,
        fileSizeInByte: 15856335,
        dateTimeOriginal: '2016-09-22T22:10:29.060Z',
        latitude: null,
        longitude: null,
        orientation: '1',
        timeZone: 'UTC-5',
      },
    },
  },
];

describe(`Format (e2e)`, () => {
  let server: any;
  let admin: LoginResponseDto;

  beforeAll(async () => {
    const app = await testApp.create();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await testApp.reset();
    await api.authApi.adminSignUp(server);
    admin = await api.authApi.adminLogin(server);
  });

  afterAll(async () => {
    await testApp.teardown();
  });

  for (const { input, expected } of tests) {
    it(`should generate a thumbnail for ${input}`, async () => {
      const filepath = join(IMMICH_TEST_ASSET_PATH, input);
      const content = await readFile(filepath);
      await api.assetApi.upload(server, admin.accessToken, 'test-device-id', {
        content,
        filename: basename(filepath),
      });
      const assets = await api.assetApi.getAllAssets(server, admin.accessToken);

      expect(assets).toHaveLength(1);

      const asset = assets[0];

      expect(asset.exifInfo).toBeDefined();
      expect(asset.exifInfo).toMatchObject(expected.exifInfo);
      expect(asset).toMatchObject(expected);
    });
  }
});
