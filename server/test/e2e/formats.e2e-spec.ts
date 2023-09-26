import { LoginResponseDto } from '@app/domain';
import { AssetType, LibraryType } from '@app/infra/entities';
import { INestApplication } from '@nestjs/common';
import { api } from '@test/api';
import { TEST_ASSET_PATH, createTestApp, db, ensureTestAssets } from '@test/test-utils';

describe(`Supported file formats (e2e)`, () => {
  let app: INestApplication;
  let server: any;
  let admin: LoginResponseDto;

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

  it('should import a jpg file', async () => {
    const library = await api.libraryApi.create(server, admin.accessToken, {
      type: LibraryType.EXTERNAL,
      importPaths: [`${TEST_ASSET_PATH}/formats/jpg`],
    });

    await api.libraryApi.scanLibrary(server, admin.accessToken, library.id, {});

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
      ]),
    );
  });

  it('should import a jpeg file', async () => {
    const library = await api.libraryApi.create(server, admin.accessToken, {
      type: LibraryType.EXTERNAL,
      importPaths: [`${TEST_ASSET_PATH}/formats/jpeg`],
    });

    await api.libraryApi.scanLibrary(server, admin.accessToken, library.id, {});

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
      ]),
    );
  });

  it('should import a heic file', async () => {
    const library = await api.libraryApi.create(server, admin.accessToken, {
      type: LibraryType.EXTERNAL,
      importPaths: [`${TEST_ASSET_PATH}/formats/heic`],
    });

    await api.libraryApi.scanLibrary(server, admin.accessToken, library.id, {});

    const assets = await api.assetApi.getAllAssets(server, admin.accessToken);

    expect(assets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: AssetType.IMAGE,
          originalFileName: 'IMG_2682',
          libraryId: library.id,
          // TODO: resized: true
          fileCreatedAt: "2019-03-21T16:04:22.348Z",
          exifInfo: expect.objectContaining({
            dateTimeOriginal: "2019-03-21T16:04:22.348Z",
            exifImageWidth: 4032,
            exifImageHeight: 3024,
            latitude: 41.2203,
            longitude: -96.071625,
          }),
        }),
      ]),
    );
  });
});
