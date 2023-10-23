import { LoginResponseDto } from '@app/domain';
import { AssetType, LibraryType } from '@app/infra/entities';
import { api } from '@test/api';
import { IMMICH_TEST_ASSET_PATH, db, runAllTests, testApp } from '@test/test-utils';

describe(`Supported file formats (e2e)`, () => {
  let server: any;
  let admin: LoginResponseDto;

  interface FormatTest {
    format: string;
    path: string;
    runTest: boolean;
    expectedAsset: any;
    expectedExif: any;
  }

  const formatTests: FormatTest[] = [
    {
      format: 'jpg',
      path: 'jpg',
      runTest: true,
      expectedAsset: {
        type: AssetType.IMAGE,
        originalFileName: 'el_torcal_rocks',
        resized: true,
      },
      expectedExif: {
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
      },
    },
    {
      format: 'jpeg',
      path: 'jpeg',
      runTest: true,
      expectedAsset: {
        type: AssetType.IMAGE,
        originalFileName: 'el_torcal_rocks',
        resized: true,
      },
      expectedExif: {
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
      },
    },
    {
      format: 'heic',
      path: 'heic',
      runTest: runAllTests,
      expectedAsset: {
        type: AssetType.IMAGE,
        originalFileName: 'IMG_2682',
        resized: true,
        fileCreatedAt: '2019-03-21T16:04:22.348Z',
      },
      expectedExif: {
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
      },
    },
    {
      format: 'png',
      path: 'png',
      runTest: true,
      expectedAsset: {
        type: AssetType.IMAGE,
        originalFileName: 'density_plot',
        resized: true,
      },
      expectedExif: {
        exifImageWidth: 800,
        exifImageHeight: 800,
        latitude: null,
        longitude: null,
        fileSizeInByte: 25408,
      },
    },
    {
      format: 'nef (Nikon D80)',
      path: 'raw/Nikon/D80',
      runTest: true,
      expectedAsset: {
        type: AssetType.IMAGE,
        originalFileName: 'glarus',
        resized: true,
        fileCreatedAt: '2010-07-20T17:27:12.000Z',
      },
      expectedExif: {
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
    {
      format: 'nef (Nikon D700)',
      path: 'raw/Nikon/D700',
      runTest: true,
      expectedAsset: {
        type: AssetType.IMAGE,
        originalFileName: 'philadelphia',
        resized: true,
        fileCreatedAt: '2016-09-22T22:10:29.060Z',
      },
      expectedExif: {
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
  ];

  // Only run tests with runTest = true
  const testsToRun = formatTests.filter((formatTest) => formatTest.runTest);

  beforeAll(async () => {
    [server] = await testApp.create({ jobs: true });
  });

  afterAll(async () => {
    await testApp.teardown();
  });

  beforeEach(async () => {
    await db.reset();
    await api.authApi.adminSignUp(server);
    admin = await api.authApi.adminLogin(server);
    await api.userApi.setExternalPath(server, admin.accessToken, admin.userId, '/');
  });

  it.each(testsToRun)('should import file of format $format', async (testedFormat) => {
    const library = await api.libraryApi.create(server, admin.accessToken, {
      type: LibraryType.EXTERNAL,
      importPaths: [`${IMMICH_TEST_ASSET_PATH}/formats/${testedFormat.path}`],
    });

    await api.libraryApi.scanLibrary(server, admin.accessToken, library.id, {});

    const assets = await api.assetApi.getAllAssets(server, admin.accessToken);

    expect(assets).toEqual([
      expect.objectContaining({
        ...testedFormat.expectedAsset,
        exifInfo: expect.objectContaining(testedFormat.expectedExif),
      }),
    ]);
  });
});
