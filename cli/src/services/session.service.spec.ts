import { SessionService } from './session.service';
import fs from 'node:fs';
import yaml from 'yaml';
import {
  TEST_AUTH_FILE,
  TEST_CONFIG_DIR,
  TEST_IMMICH_API_KEY,
  TEST_IMMICH_INSTANCE_URL,
  createTestAuthFile,
  deleteAuthFile,
  readTestAuthFile,
  spyOnConsole,
} from '../../test/cli-test-utils';

const mocks = vi.hoisted(() => {
  return {
    getMyUserInfo: vi.fn(() => Promise.resolve({ email: 'admin@example.com' })),
    pingServer: vi.fn(() => Promise.resolve({ res: 'pong' })),
  };
});

vi.mock('./api.service', async (importOriginal) => {
  const module = await importOriginal<typeof import('./api.service')>();
  // @ts-expect-error this is only a partial implementation of the return value
  module.ImmichApi.prototype.getMyUserInfo = mocks.getMyUserInfo;
  module.ImmichApi.prototype.pingServer = mocks.pingServer;
  return module;
});

describe('SessionService', () => {
  let sessionService: SessionService;

  beforeEach(() => {
    deleteAuthFile();
    sessionService = new SessionService(TEST_CONFIG_DIR);
  });

  afterEach(() => {
    deleteAuthFile();
  });

  it('should connect to immich', async () => {
    await createTestAuthFile(
      JSON.stringify({
        apiKey: TEST_IMMICH_API_KEY,
        instanceUrl: TEST_IMMICH_INSTANCE_URL,
      }),
    );

    await sessionService.connect();
    expect(mocks.pingServer).toHaveBeenCalledTimes(1);
  });

  it('should error if no auth file exists', async () => {
    await sessionService.connect().catch((error) => {
      expect(error.message).toEqual('No auth file exist. Please login first');
    });
  });

  it('should error if auth file is missing instance URl', async () => {
    await createTestAuthFile(
      JSON.stringify({
        apiKey: TEST_IMMICH_API_KEY,
      }),
    );
    await sessionService.connect().catch((error) => {
      expect(error.message).toEqual(`Instance URL missing in auth config file ${TEST_AUTH_FILE}`);
    });
  });

  it('should error if auth file is missing api key', async () => {
    await createTestAuthFile(
      JSON.stringify({
        instanceUrl: TEST_IMMICH_INSTANCE_URL,
      }),
    );

    await expect(sessionService.connect()).rejects.toThrow(`API key missing in auth config file ${TEST_AUTH_FILE}`);
  });

  it('should create auth file when logged in', async () => {
    await sessionService.login(TEST_IMMICH_INSTANCE_URL, TEST_IMMICH_API_KEY);

    const data: string = await readTestAuthFile();
    const authConfig = yaml.parse(data);
    expect(authConfig.instanceUrl).toBe(TEST_IMMICH_INSTANCE_URL);
    expect(authConfig.apiKey).toBe(TEST_IMMICH_API_KEY);
  });

  it('should delete auth file when logging out', async () => {
    const consoleSpy = spyOnConsole();

    await createTestAuthFile(
      JSON.stringify({
        apiKey: TEST_IMMICH_API_KEY,
        instanceUrl: TEST_IMMICH_INSTANCE_URL,
      }),
    );
    await sessionService.logout();

    await fs.promises.access(TEST_AUTH_FILE, fs.constants.F_OK).catch((error) => {
      expect(error.message).toContain('ENOENT');
    });

    expect(consoleSpy.mock.calls).toEqual([
      ['Logging out...'],
      [`Removed auth file ${TEST_AUTH_FILE}`],
      ['Successfully logged out'],
    ]);
  });
});
