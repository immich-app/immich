import { IMMICH_TEST_ASSET_PATH, restoreTempFolder, testApp } from '@test-utils';
import { CLI_BASE_OPTIONS, setup, spyOnConsole } from 'test/cli-test-utils';
import { UploadCommand } from '../../src/commands/upload.command';
import { ImmichApi } from 'src/services/api.service';

describe(`upload (e2e)`, () => {
  let api: ImmichApi;

  spyOnConsole();

  beforeAll(async () => {
    await testApp.create();
  });

  afterAll(async () => {
    await testApp.teardown();
    await restoreTempFolder();
  });

  beforeEach(async () => {
    await testApp.reset();
    await restoreTempFolder();
    api = await setup();
    process.env.IMMICH_API_KEY = api.apiKey;
  });

  it('should upload a folder recursively', async () => {
    await new UploadCommand(CLI_BASE_OPTIONS).run([`${IMMICH_TEST_ASSET_PATH}/albums/nature/`], { recursive: true });
    const assets = await api.getAllAssets();
    expect(assets.length).toBeGreaterThan(4);
  });

  it('should not create a new album', async () => {
    await new UploadCommand(CLI_BASE_OPTIONS).run([`${IMMICH_TEST_ASSET_PATH}/albums/nature/`], { recursive: true });
    const albums = await api.getAllAlbums();
    expect(albums.length).toEqual(0);
  });

  it('should create album from folder name', async () => {
    await new UploadCommand(CLI_BASE_OPTIONS).run([`${IMMICH_TEST_ASSET_PATH}/albums/nature/`], {
      recursive: true,
      album: true,
    });

    const albums = await api.getAllAlbums();
    expect(albums.length).toEqual(1);
    const natureAlbum = albums[0];
    expect(natureAlbum.albumName).toEqual('nature');
  });

  it('should add existing assets to album', async () => {
    await new UploadCommand(CLI_BASE_OPTIONS).run([`${IMMICH_TEST_ASSET_PATH}/albums/nature/`], {
      recursive: true,
    });

    // upload again, but this time add to album
    await new UploadCommand(CLI_BASE_OPTIONS).run([`${IMMICH_TEST_ASSET_PATH}/albums/nature/`], {
      recursive: true,
      album: true,
    });

    const albums = await api.getAllAlbums();
    expect(albums.length).toEqual(1);
    const natureAlbum = albums[0];
    expect(natureAlbum.albumName).toEqual('nature');
  });

  it('should upload to the specified album name', async () => {
    await new UploadCommand(CLI_BASE_OPTIONS).run([`${IMMICH_TEST_ASSET_PATH}/albums/nature/`], {
      recursive: true,
      albumName: 'testAlbum',
    });

    const albums = await api.getAllAlbums();
    expect(albums.length).toEqual(1);
    const testAlbum = albums[0];
    expect(testAlbum.albumName).toEqual('testAlbum');
  });
});
