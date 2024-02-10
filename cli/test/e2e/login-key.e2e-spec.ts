import { restoreTempFolder, testApp } from '@test-utils';
import { CLI_BASE_OPTIONS, TEST_AUTH_FILE, deleteAuthFile, setup, spyOnConsole } from 'test/cli-test-utils';
import { readFile, stat } from 'node:fs/promises';
import { LoginCommand } from '../../src/commands/login.command';
import yaml from 'yaml';

describe(`login-key (e2e)`, () => {
  let apiKey: string;
  let instanceUrl: string;

  spyOnConsole();

  beforeAll(async () => {
    await testApp.create();
    if (process.env.IMMICH_INSTANCE_URL) {
      instanceUrl = process.env.IMMICH_INSTANCE_URL;
    } else {
      throw new Error('IMMICH_INSTANCE_URL environment variable not set');
    }
  });

  afterAll(async () => {
    await testApp.teardown();
    await restoreTempFolder();
    deleteAuthFile();
  });

  beforeEach(async () => {
    await testApp.reset();
    await restoreTempFolder();

    const api = await setup();
    apiKey = api.apiKey;

    deleteAuthFile();
  });

  it('should error when providing an invalid API key', async () => {
    await expect(new LoginCommand(CLI_BASE_OPTIONS).run(instanceUrl, 'invalid')).rejects.toThrow(
      `Failed to connect to server ${instanceUrl}: Error: 401`,
    );
  });

  it('should log in when providing the correct API key', async () => {
    await new LoginCommand(CLI_BASE_OPTIONS).run(instanceUrl, apiKey);
  });

  it('should create an auth file when logging in', async () => {
    await new LoginCommand(CLI_BASE_OPTIONS).run(instanceUrl, apiKey);

    const data: string = await readFile(TEST_AUTH_FILE, 'utf8');
    const parsedConfig = yaml.parse(data);

    expect(parsedConfig).toEqual(expect.objectContaining({ instanceUrl, apiKey }));
  });

  it('should create an auth file with chmod 600', async () => {
    await new LoginCommand(CLI_BASE_OPTIONS).run(instanceUrl, apiKey);

    const stats = await stat(TEST_AUTH_FILE);
    const mode = (stats.mode & 0o777).toString(8);

    expect(mode).toEqual('600');
  });
});
