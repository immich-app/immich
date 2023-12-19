import { api } from '@test/api';
import { IMMICH_TEST_ASSET_PATH, restoreTempFolder, testApp } from 'immich/test/test-utils';
import { LoginResponseDto } from 'src/api/open-api';
import Upload from 'src/commands/upload';
import { APIKeyCreateResponseDto } from '@app/domain';
import { CLI_BASE_OPTIONS, spyOnConsole } from 'test/cli-test-utils';

describe(`upload (e2e)`, () => {
  let server: any;
  let admin: LoginResponseDto;
  let apiKey: APIKeyCreateResponseDto;
  spyOnConsole();

  beforeAll(async () => {
    server = (await testApp.create()).getHttpServer();
  });

  afterAll(async () => {
    await testApp.teardown();
    await restoreTempFolder();
  });

  beforeEach(async () => {
    await testApp.reset();
    await restoreTempFolder();
    await api.authApi.adminSignUp(server);
    admin = await api.authApi.adminLogin(server);
    apiKey = await api.apiKeyApi.createApiKey(server, admin.accessToken);
    process.env.IMMICH_API_KEY = apiKey.secret;
  });

  it('should upload a folder recursively', async () => {
    await new Upload(CLI_BASE_OPTIONS).run([`${IMMICH_TEST_ASSET_PATH}/albums/nature/`], { recursive: true });
    const assets = await api.assetApi.getAllAssets(server, admin.accessToken);
    expect(assets.length).toBeGreaterThan(4);
  });

  it('should not create a new album', async () => {
    await new Upload(CLI_BASE_OPTIONS).run([`${IMMICH_TEST_ASSET_PATH}/albums/nature/`], { recursive: true });
    const albums = await api.albumApi.getAllAlbums(server, admin.accessToken);
    expect(albums.length).toEqual(0);
  });

  it('should create album from folder name', async () => {
    await new Upload(CLI_BASE_OPTIONS).run([`${IMMICH_TEST_ASSET_PATH}/albums/nature/`], {
      recursive: true,
      album: true,
    });

    const albums = await api.albumApi.getAllAlbums(server, admin.accessToken);
    expect(albums.length).toEqual(1);
    const natureAlbum = albums[0];
    expect(natureAlbum.albumName).toEqual('nature');
  });

  it('should add existing assets to album', async () => {
    await new Upload(CLI_BASE_OPTIONS).run([`${IMMICH_TEST_ASSET_PATH}/albums/nature/`], {
      recursive: true,
    });

    // Upload again, but this time add to album
    await new Upload(CLI_BASE_OPTIONS).run([`${IMMICH_TEST_ASSET_PATH}/albums/nature/`], {
      recursive: true,
      album: true,
    });

    const albums = await api.albumApi.getAllAlbums(server, admin.accessToken);
    expect(albums.length).toEqual(1);
    const natureAlbum = albums[0];
    expect(natureAlbum.albumName).toEqual('nature');
  });

  it('should upload to the specified album name', async () => {
    await new Upload(CLI_BASE_OPTIONS).run([`${IMMICH_TEST_ASSET_PATH}/albums/nature/`], {
      recursive: true,
      albumName: 'testAlbum',
    });

    const albums = await api.albumApi.getAllAlbums(server, admin.accessToken);
    expect(albums.length).toEqual(1);
    const testAlbum = albums[0];
    expect(testAlbum.albumName).toEqual('testAlbum');
  });
});
