import { api } from '@test/api';
import * as fs from 'fs';
import {
  IMMICH_TEST_ASSET_PATH,
  IMMICH_TEST_ASSET_TEMP_PATH,
  restoreTempFolder,
  testApp,
} from 'immich/test/test-utils';
import { LoginResponseDto } from 'src/api/open-api';
import ServerInfo from 'src/commands/server-info';
import Upload from 'src/commands/upload';
import { INestApplication } from '@nestjs/common';
import { Http2SecureServer } from 'http2';
import { APIKeyCreateResponseDto } from '@app/domain';

describe(`upload (e2e)`, () => {
  let server: any;
  let admin: LoginResponseDto;
  let apiKey: APIKeyCreateResponseDto;
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

  beforeAll(async () => {
    server = (await testApp.create({ jobs: true })).getHttpServer();
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
    await new Upload().run([`${IMMICH_TEST_ASSET_PATH}/albums/nature/`], { recursive: true });
    const assets = await api.assetApi.getAllAssets(server, admin.accessToken);
    expect(assets.length).toBeGreaterThan(4);
  });

  it('should create album from folder name', async () => {
    await new Upload().run([`${IMMICH_TEST_ASSET_PATH}/albums/nature/`], { recursive: true, album: true });
    const albums = await api.albumApi.getAllAlbums(server, admin.accessToken);
    expect(albums.length).toEqual(1);
  });
});
