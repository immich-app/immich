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

describe(`CLI (e2e)`, () => {
  let server: any;
  let admin: LoginResponseDto;

  beforeAll(async () => {
    [server] = await testApp.create({ jobs: true });
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
  });

  describe('server-info', () => {
    it('should show server version', async () => {
      await new ServerInfo().run();
    });
  });

  describe('upload', () => {
    it('should upload an asset', async () => {
      await fs.promises.cp(`${IMMICH_TEST_ASSET_PATH}/albums/nature`, `${IMMICH_TEST_ASSET_TEMP_PATH}/albums/nature`, {
        recursive: true,
      });

      await new Upload().run([`${IMMICH_TEST_ASSET_TEMP_PATH}/albums/nature`], {});
      const assets = await api.assetApi.getAllAssets(server, admin.accessToken);
      console.log(assets);
    });
  });
});
