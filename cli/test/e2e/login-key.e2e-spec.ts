import { APIKeyCreateResponseDto } from '@app/domain';
import { api } from '@test/../e2e/api/client';
import { restoreTempFolder, testApp } from '@test/../e2e/jobs/utils';
import { LoginResponseDto } from '@immich/sdk';
import { LoginKey } from 'src/commands/login/key';
import { LoginError } from 'src/cores/errors/login-error';
import { CLI_BASE_OPTIONS, spyOnConsole } from 'test/cli-test-utils';

describe(`login-key (e2e)`, () => {
  let server: any;
  let admin: LoginResponseDto;
  let apiKey: APIKeyCreateResponseDto;
  let instanceUrl: string;
  spyOnConsole();

  beforeAll(async () => {
    server = (await testApp.create()).getHttpServer();
    if (!process.env.IMMICH_INSTANCE_URL) {
      throw new Error('IMMICH_INSTANCE_URL environment variable not set');
    } else {
      instanceUrl = process.env.IMMICH_INSTANCE_URL;
    }
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

  it('should error when providing an invalid API key', async () => {
    await expect(async () => await new LoginKey(CLI_BASE_OPTIONS).run(instanceUrl, 'invalid')).rejects.toThrow(
      new LoginError(`Failed to connect to server ${instanceUrl}: Request failed with status code 401`),
    );
  });

  it('should log in when providing the correct API key', async () => {
    await new LoginKey(CLI_BASE_OPTIONS).run(instanceUrl, apiKey.secret);
  });
});
