import { restoreTempFolder, testApp } from '@test/../e2e/jobs/utils';
import { CLI_BASE_OPTIONS, setup, spyOnConsole } from 'test/cli-test-utils';
import { LoginCommand } from '../../src/commands/login';

describe(`login-key (e2e)`, () => {
  let apiKey: string;
  let instanceUrl: string;

  spyOnConsole();

  beforeAll(async () => {
    await testApp.create();
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

    const api = await setup();
    apiKey = api.apiKey;
  });

  it('should error when providing an invalid API key', async () => {
    await expect(new LoginCommand(CLI_BASE_OPTIONS).run(instanceUrl, 'invalid')).rejects.toThrow(
      `Failed to connect to server ${instanceUrl}: Request failed with status code 401`,
    );
  });

  it('should log in when providing the correct API key', async () => {
    await new LoginCommand(CLI_BASE_OPTIONS).run(instanceUrl, apiKey);
  });
});
