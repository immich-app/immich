import { LoginResponseDto } from '@app/domain';
import { AssetType, LibraryType } from '@app/infra/entities';
import { INestApplication } from '@nestjs/common';
import { api } from '@test/api';
import { TEST_ASSET_PATH, createTestApp, db, ensureTestAssets } from '@test/test-utils';

describe(`Supported file formats (e2e)`, () => {
  let app: INestApplication;
  let server: any;
  let admin: LoginResponseDto;

  type Format = [string, string, any];

  const formats = [
    [
      'jpg',
      'jpg',
      {
        type: AssetType.IMAGE,
        originalFileName: 'el_torcal_rocks',
        resized: true,
        exifInfo: expect.objectContaining({
          exifImageWidth: 512,
          exifImageHeight: 341,
          latitude: null,
          longitude: null,
        }),
      },
    ],
    [
      'jpeg',
      'jpeg',
      {
        type: AssetType.IMAGE,
        originalFileName: 'el_torcal_rocks',
        resized: true,
        exifInfo: expect.objectContaining({
          exifImageWidth: 512,
          exifImageHeight: 341,
          latitude: null,
          longitude: null,
        }),
      },
    ],
    [
      'heic',
      'heic',
      {
        type: AssetType.IMAGE,
        originalFileName: 'IMG_2682',
        // TODO: resized: true
        fileCreatedAt: '2019-03-21T16:04:22.348Z',
        exifInfo: expect.objectContaining({
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
          state: 'Douglas County, Nebraska',
          timeZone: 'America/Chicago',
          city: 'Ralston',
          country: 'United States of America',
        }),
      },
    ],
    [
      'png',
      'png',
      {
        type: AssetType.IMAGE,
        originalFileName: 'density_plot',
        resized: true,
        exifInfo: expect.objectContaining({
          exifImageWidth: 800,
          exifImageHeight: 800,
          latitude: null,
          longitude: null,
          fileSizeInByte: 25408,
        }),
      },
    ],
    [
      'nef (Nikon D80)',
      'raw/Nikon/D80',
      {
        type: AssetType.IMAGE,
        originalFileName: 'glarus',
        resized: true,
        fileCreatedAt: '2010-07-20T17:27:12.000Z',
        exifInfo: expect.objectContaining({
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
        }),
      },
    ],
    [
      'nef (Nikon D700)',
      'raw/Nikon/D700',
      {
        type: AssetType.IMAGE,
        originalFileName: 'philadelphia',
        resized: true,
        fileCreatedAt: '2016-09-22T22:10:29.060Z',
        exifInfo: expect.objectContaining({
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
        }),
      },
    ],
  ] as Format[];

  beforeAll(async () => {
    app = await createTestApp(true);
    server = app.getHttpServer();
    await ensureTestAssets();
  });

  beforeEach(async () => {
    await db.reset();
    await api.authApi.adminSignUp(server);
    admin = await api.authApi.adminLogin(server);
    await api.userApi.setExternalPath(server, admin.accessToken, admin.userId, '/');
  });

  afterAll(async () => {
    await db.disconnect();
    await app.close();
  });

  it.each(formats)('should import a %s file', async (format: string, folder: string, expectation: any) => {
    const library = await api.libraryApi.create(server, admin.accessToken, {
      type: LibraryType.EXTERNAL,
      importPaths: [`${TEST_ASSET_PATH}/formats/${folder}`],
    });

    await api.libraryApi.scanLibrary(server, admin.accessToken, library.id, {});

    const assets = await api.assetApi.getAllAssets(server, admin.accessToken);

    expect(assets).toEqual(expect.arrayContaining([expect.objectContaining(expectation)]));
  });
});
