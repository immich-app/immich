import {
  LoginResponseDto,
  createApiKey,
  defaults,
  login,
  setAdminOnboarding,
  signUpAdmin,
} from '@immich/sdk';
import { BrowserContext } from '@playwright/test';
import { spawn } from 'child_process';
import { access } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { loginDto, signupDto } from 'src/fixtures';

export const app = 'http://127.0.0.1:2283/api';

const directoryExists = (directory: string) =>
  access(directory)
    .then(() => true)
    .catch(() => false);

// TODO move test assets into e2e/assets
export const testAssetDir = path.resolve(`./../server/test/assets/`);

if (!(await directoryExists(`${testAssetDir}/albums`))) {
  throw new Error(
    `Test assets not found. Please checkout https://github.com/immich-app/test-assets into ${testAssetDir} before testing`
  );
}

const setBaseUrl = () => (defaults.baseUrl = app);
export const asBearerAuth = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
});

export const asKeyAuth = (key: string) => ({ 'x-api-key': key });

let client: pg.Client | null = null;

export const dbUtils = {
  reset: async () => {
    try {
      if (!client) {
        client = new pg.Client(
          'postgres://postgres:postgres@127.0.0.1:5433/immich'
        );
        await client.connect();
      }

      for (const table of [
        'albums',
        'assets',
        'api_keys',
        'user_token',
        'users',
        'system_metadata',
      ]) {
        await client.query(`DELETE FROM ${table} CASCADE;`);
      }
    } catch (error) {
      console.error('Failed to reset database', error);
      throw error;
    }
  },
  teardown: async () => {
    try {
      if (client) {
        await client.end();
        client = null;
      }
    } catch (error) {
      console.error('Failed to teardown database', error);
      throw error;
    }
  },
};
export interface CliResponse {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export const immichCli = async (args: string[]) => {
  let _resolve: (value: CliResponse) => void;
  const deferred = new Promise<CliResponse>((resolve) => (_resolve = resolve));
  const _args = ['node_modules/.bin/immich', '-d', '/tmp/immich/', ...args];
  const child = spawn('node', _args, {
    stdio: 'pipe',
  });

  let stdout = '';
  let stderr = '';

  child.stdout.on('data', (data) => (stdout += data.toString()));
  child.stderr.on('data', (data) => (stderr += data.toString()));
  child.on('exit', (exitCode) => {
    _resolve({
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode,
    });
  });

  return deferred;
};

export const apiUtils = {
  setup: () => {
    setBaseUrl();
  },
  adminSetup: async () => {
    await signUpAdmin({ signUpDto: signupDto.admin });
    const response = await login({ loginCredentialDto: loginDto.admin });
    await setAdminOnboarding({ headers: asBearerAuth(response.accessToken) });
    return response;
  },
  createApiKey: (accessToken: string) => {
    return createApiKey(
      { apiKeyCreateDto: { name: 'e2e' } },
      { headers: asBearerAuth(accessToken) }
    );
  },
};

export const cliUtils = {
  login: async () => {
    const admin = await apiUtils.adminSetup();
    const key = await apiUtils.createApiKey(admin.accessToken);
    await immichCli(['login-key', app, `${key.secret}`]);
    return key.secret;
  },
};

export const webUtils = {
  setAuthCookies: async (context: BrowserContext, response: LoginResponseDto) =>
    await context.addCookies([
      {
        name: 'immich_access_token',
        value: response.accessToken,
        domain: '127.0.0.1',
        path: '/',
        expires: 1742402728,
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
      {
        name: 'immich_auth_type',
        value: 'password',
        domain: '127.0.0.1',
        path: '/',
        expires: 1742402728,
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
      {
        name: 'immich_is_authenticated',
        value: 'true',
        domain: '127.0.0.1',
        path: '/',
        expires: 1742402728,
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ]),
};
