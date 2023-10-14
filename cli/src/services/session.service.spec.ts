import { SessionService } from './session.service';
import mockfs from 'mock-fs';
import fs from 'node:fs';
import yaml from 'yaml';
import { LoginError } from '../cores/errors/login-error';

const mockPingServer = jest.fn(() => Promise.resolve({ data: { res: 'pong' } }));
const mockUserInfo = jest.fn(() => Promise.resolve({ data: { email: 'admin@example.com' } }));

jest.mock('../api/open-api', () => {
  return {
    __esModule: true,
    ...jest.requireActual('../api/open-api'),
    UserApi: jest.fn().mockImplementation(() => {
      return { getMyUserInfo: mockUserInfo };
    }),
    ServerInfoApi: jest.fn().mockImplementation(() => {
      return { pingServer: mockPingServer };
    }),
  };
});

describe('SessionService', () => {
  let sessionService: SessionService;
  beforeAll(() => {
    // Write a dummy output before mock-fs to prevent some annoying errors
    console.log();
  });

  beforeEach(() => {
    const configDir = '/config';
    sessionService = new SessionService(configDir);
  });

  it('should connect to immich', async () => {
    mockfs({
      '/config/auth.yml': 'apiKey: pNussssKSYo5WasdgalvKJ1n9kdvaasdfbluPg\ninstanceUrl: https://test/api',
    });
    await sessionService.connect();
    expect(mockPingServer).toHaveBeenCalledTimes(1);
  });

  it('should error if no auth file exists', async () => {
    mockfs();
    await sessionService.connect().catch((error) => {
      expect(error.message).toEqual('No auth file exist. Please login first');
    });
  });

  it('should error if auth file is missing instance URl', async () => {
    mockfs({
      '/config/auth.yml': 'foo: pNussssKSYo5WasdgalvKJ1n9kdvaasdfbluPg\napiKey: https://test/api',
    });
    await sessionService.connect().catch((error) => {
      expect(error).toBeInstanceOf(LoginError);
      expect(error.message).toEqual('Instance URL missing in auth config file /config/auth.yml');
    });
  });

  it('should error if auth file is missing api key', async () => {
    mockfs({
      '/config/auth.yml': 'instanceUrl: pNussssKSYo5WasdgalvKJ1n9kdvaasdfbluPg\nbar: https://test/api',
    });
    await sessionService.connect().catch((error) => {
      expect(error).toBeInstanceOf(LoginError);
      expect(error.message).toEqual('API key missing in auth config file /config/auth.yml');
    });
  });

  it.skip('should create auth file when logged in', async () => {
    mockfs();

    await sessionService.keyLogin('https://test/api', 'pNussssKSYo5WasdgalvKJ1n9kdvaasdfbluPg');

    const data: string = await fs.promises.readFile('/config/auth.yml', 'utf8');
    const authConfig = yaml.parse(data);
    expect(authConfig.instanceUrl).toBe('https://test/api');
    expect(authConfig.apiKey).toBe('pNussssKSYo5WasdgalvKJ1n9kdvaasdfbluPg');
  });

  it('should delete auth file when logging out', async () => {
    mockfs({
      '/config/auth.yml': 'apiKey: pNussssKSYo5WasdgalvKJ1n9kdvaasdfbluPg\ninstanceUrl: https://test/api',
    });
    await sessionService.logout();

    await fs.promises.access('/auth.yml', fs.constants.F_OK).catch((error) => {
      expect(error.message).toContain('ENOENT');
    });
  });

  afterEach(() => {
    mockfs.restore();
  });
});
