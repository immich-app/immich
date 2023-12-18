import { api } from '@test/api';
import { restoreTempFolder, testApp } from 'immich/test/test-utils';
import { LoginResponseDto } from 'src/api/open-api';
import ServerInfo from 'src/commands/server-info';
import { APIKeyCreateResponseDto } from '@app/domain';
import { CLI_BASE_OPTIONS, spyOnConsole } from 'test/cli-test-utils';

describe(`server-info (e2e)`, () => {
  let server: any;
  let admin: LoginResponseDto;
  let apiKey: APIKeyCreateResponseDto;
  const consoleSpy = spyOnConsole();

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

  it('should show server version', async () => {
    await new ServerInfo(CLI_BASE_OPTIONS).run();

    expect(consoleSpy.mock.calls).toEqual([
      [expect.stringMatching(new RegExp('Server is running version \\d+.\\d+.\\d+'))],
      [expect.stringMatching('Supported image types: .*')],
      [expect.stringMatching('Supported video types: .*')],
      ['Images: 0, Videos: 0, Total: 0'],
    ]);
  });
});
