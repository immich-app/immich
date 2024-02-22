import {
  AssetResponseDto,
  CreateAlbumDto,
  CreateAssetDto,
  CreateUserDto,
  PersonUpdateDto,
  SharedLinkCreateDto,
  createAlbum,
  createApiKey,
  createPerson,
  createSharedLink,
  createUser,
  defaults,
  login,
  setAdminOnboarding,
  signUpAdmin,
  updatePerson,
} from '@immich/sdk';
import { BrowserContext } from '@playwright/test';
import { exec, spawn } from 'child_process';
import { randomBytes } from 'node:crypto';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import pg from 'pg';
import { loginDto, signupDto } from 'src/fixtures';
import request from 'supertest';

const execPromise = promisify(exec);

export const app = 'http://127.0.0.1:2283/api';

const directoryExists = (directory: string) =>
  access(directory)
    .then(() => true)
    .catch(() => false);

// TODO move test assets into e2e/assets
export const testAssetDir = path.resolve(`./../server/test/assets/`);

const serverContainerName = 'immich-e2e-server';
const uploadMediaDir = '/usr/src/app/upload/upload';

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

export const fileUtils = {
  reset: async () => {
    await execPromise(
      `docker exec -i "${serverContainerName}" rm -R "${uploadMediaDir}"`
    );
  },
};

export const dbUtils = {
  createFace: async ({
    assetId,
    personId,
  }: {
    assetId: string;
    personId: string;
  }) => {
    if (!client) {
      return;
    }

    const vector = Array.from({ length: 512 }, Math.random);
    const embedding = `[${vector.join(',')}]`;

    await client.query(
      'INSERT INTO asset_faces ("assetId", "personId", "embedding") VALUES ($1, $2, $3)',
      [assetId, personId, embedding]
    );
  },
  setPersonThumbnail: async (personId: string) => {
    if (!client) {
      return;
    }

    await client.query(
      `UPDATE "person" set "thumbnailPath" = '/my/awesome/thumbnail.jpg' where "id" = $1`,
      [personId]
    );
  },
  reset: async (tables?: string[]) => {
    try {
      if (!client) {
        client = new pg.Client(
          'postgres://postgres:postgres@127.0.0.1:5433/immich'
        );
        await client.connect();
      }

      tables = tables || [
        'shared_links',
        'person',
        'albums',
        'assets',
        'asset_faces',
        'activity',
        'api_keys',
        'user_token',
        'users',
        'system_metadata',
      ];

      for (const table of tables) {
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

export interface AdminSetupOptions {
  onboarding?: boolean;
}

export const apiUtils = {
  setup: () => {
    setBaseUrl();
  },
  adminSetup: async (options?: AdminSetupOptions) => {
    options = options || { onboarding: true };

    await signUpAdmin({ signUpDto: signupDto.admin });
    const response = await login({ loginCredentialDto: loginDto.admin });
    if (options.onboarding) {
      await setAdminOnboarding({ headers: asBearerAuth(response.accessToken) });
    }
    return response;
  },
  userSetup: async (accessToken: string, dto: CreateUserDto) => {
    await createUser(
      { createUserDto: dto },
      { headers: asBearerAuth(accessToken) }
    );
    return login({
      loginCredentialDto: { email: dto.email, password: dto.password },
    });
  },
  createApiKey: (accessToken: string) => {
    return createApiKey(
      { apiKeyCreateDto: { name: 'e2e' } },
      { headers: asBearerAuth(accessToken) }
    );
  },
  createAlbum: (accessToken: string, dto: CreateAlbumDto) =>
    createAlbum(
      { createAlbumDto: dto },
      { headers: asBearerAuth(accessToken) }
    ),
  createAsset: async (
    accessToken: string,
    dto?: Omit<CreateAssetDto, 'assetData'>
  ) => {
    dto = dto || {
      deviceAssetId: 'test-1',
      deviceId: 'test',
      fileCreatedAt: new Date().toISOString(),
      fileModifiedAt: new Date().toISOString(),
    };
    const { body } = await request(app)
      .post(`/asset/upload`)
      .field('deviceAssetId', dto.deviceAssetId)
      .field('deviceId', dto.deviceId)
      .field('fileCreatedAt', dto.fileCreatedAt)
      .field('fileModifiedAt', dto.fileModifiedAt)
      .attach('assetData', randomBytes(32), 'example.jpg')
      .set('Authorization', `Bearer ${accessToken}`);

    return body as AssetResponseDto;
  },
  createPerson: async (accessToken: string, dto: PersonUpdateDto) => {
    // TODO fix createPerson to accept a body
    const { id } = await createPerson({ headers: asBearerAuth(accessToken) });
    await dbUtils.setPersonThumbnail(id);
    return updatePerson(
      { id, personUpdateDto: dto },
      { headers: asBearerAuth(accessToken) }
    );
  },
  createSharedLink: (accessToken: string, dto: SharedLinkCreateDto) =>
    createSharedLink(
      { sharedLinkCreateDto: dto },
      { headers: asBearerAuth(accessToken) }
    ),
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
  setAuthCookies: async (context: BrowserContext, accessToken: string) =>
    await context.addCookies([
      {
        name: 'immich_access_token',
        value: accessToken,
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
