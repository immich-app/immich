import {
  AssetFileUploadResponseDto,
  AssetResponseDto,
  CreateAlbumDto,
  CreateAssetDto,
  CreateLibraryDto,
  CreateUserDto,
  PersonCreateDto,
  SharedLinkCreateDto,
  ValidateLibraryDto,
  createAlbum,
  createApiKey,
  createLibrary,
  createPerson,
  createSharedLink,
  createUser,
  defaults,
  deleteAssets,
  getAssetInfo,
  login,
  setAdminOnboarding,
  signUpAdmin,
  validate,
} from '@immich/sdk';
import { BrowserContext } from '@playwright/test';
import { exec, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import pg from 'pg';
import { io, type Socket } from 'socket.io-client';
import { loginDto, signupDto } from 'src/fixtures';
import { makeRandomImage } from 'src/generators';
import request from 'supertest';

type CliResponse = { stdout: string; stderr: string; exitCode: number | null };
type EventType = 'upload' | 'delete';
type WaitOptions = { event: EventType; assetId: string; timeout?: number };
type AdminSetupOptions = { onboarding?: boolean };
type AssetData = { bytes?: Buffer; filename: string };

const dbUrl = 'postgres://postgres:postgres@127.0.0.1:5433/immich';
const baseUrl = 'http://127.0.0.1:2283';

export const app = `${baseUrl}/api`;
// TODO move test assets into e2e/assets
export const testAssetDir = path.resolve(`./../server/test/assets/`);
export const testAssetDirInternal = '/data/assets';
export const tempDir = tmpdir();
export const asBearerAuth = (accessToken: string) => ({ Authorization: `Bearer ${accessToken}` });
export const asKeyAuth = (key: string) => ({ 'x-api-key': key });
export const immichCli = async (args: string[]) => {
  let _resolve: (value: CliResponse) => void;
  const deferred = new Promise<CliResponse>((resolve) => (_resolve = resolve));
  const _args = ['node_modules/.bin/immich', '-d', `/${tempDir}/immich/`, ...args];
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

let client: pg.Client | null = null;

const events: Record<EventType, Set<string>> = {
  upload: new Set<string>(),
  delete: new Set<string>(),
};

const callbacks: Record<string, () => void> = {};

const execPromise = promisify(exec);

const onEvent = ({ event, assetId }: { event: EventType; assetId: string }) => {
  events[event].add(assetId);
  const callback = callbacks[assetId];
  if (callback) {
    callback();
    delete callbacks[assetId];
  }
};

export const utils = {
  resetDatabase: async (tables?: string[]) => {
    try {
      if (!client) {
        client = new pg.Client(dbUrl);
        await client.connect();
      }

      tables = tables || [
        'libraries',
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

  resetFilesystem: async () => {
    const mediaInternal = '/usr/src/app/upload';
    const dirs = [
      `"${mediaInternal}/thumbs"`,
      `"${mediaInternal}/upload"`,
      `"${mediaInternal}/library"`,
      `"${mediaInternal}/encoded-video"`,
    ].join(' ');

    await execPromise(`docker exec -i "immich-e2e-server" /bin/bash -c "rm -rf ${dirs} && mkdir ${dirs}"`);
  },

  unzip: async (input: string, output: string) => {
    await execPromise(`unzip -o -d "${output}" "${input}"`);
  },

  sha1: (bytes: Buffer) => createHash('sha1').update(bytes).digest('base64'),

  connectWebsocket: async (accessToken: string) => {
    const websocket = io(baseUrl, {
      path: '/api/socket.io',
      transports: ['websocket'],
      extraHeaders: { Authorization: `Bearer ${accessToken}` },
      autoConnect: true,
      forceNew: true,
    });

    return new Promise<Socket>((resolve) => {
      websocket
        .on('connect', () => resolve(websocket))
        .on('on_upload_success', (data: AssetResponseDto) => onEvent({ event: 'upload', assetId: data.id }))
        .on('on_asset_delete', (assetId: string) => onEvent({ event: 'delete', assetId }))
        .connect();
    });
  },

  disconnectWebsocket: (ws: Socket) => {
    if (ws?.connected) {
      ws.disconnect();
    }

    for (const set of Object.values(events)) {
      set.clear();
    }
  },

  waitForWebsocketEvent: async ({ event, assetId, timeout: ms }: WaitOptions): Promise<void> => {
    const set = events[event];
    if (set.has(assetId)) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${event} event`)), ms || 10_000);

      callbacks[assetId] = () => {
        clearTimeout(timeout);
        resolve();
      };
    });
  },

  setApiEndpoint: () => {
    defaults.baseUrl = app;
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
    await createUser({ createUserDto: dto }, { headers: asBearerAuth(accessToken) });
    return login({
      loginCredentialDto: { email: dto.email, password: dto.password },
    });
  },

  createApiKey: (accessToken: string) => {
    return createApiKey({ apiKeyCreateDto: { name: 'e2e' } }, { headers: asBearerAuth(accessToken) });
  },

  createAlbum: (accessToken: string, dto: CreateAlbumDto) =>
    createAlbum({ createAlbumDto: dto }, { headers: asBearerAuth(accessToken) }),

  createAsset: async (
    accessToken: string,
    dto?: Partial<Omit<CreateAssetDto, 'assetData'>> & { assetData?: AssetData },
  ) => {
    const _dto = {
      deviceAssetId: 'test-1',
      deviceId: 'test',
      fileCreatedAt: new Date().toISOString(),
      fileModifiedAt: new Date().toISOString(),
      ...dto,
    };

    const assetData = dto?.assetData?.bytes || makeRandomImage();
    const filename = dto?.assetData?.filename || 'example.png';

    const builder = request(app)
      .post(`/asset/upload`)
      .attach('assetData', assetData, filename)
      .set('Authorization', `Bearer ${accessToken}`);

    for (const [key, value] of Object.entries(_dto)) {
      void builder.field(key, String(value));
    }

    const { body } = await builder;

    return body as AssetFileUploadResponseDto;
  },

  getAssetInfo: (accessToken: string, id: string) => getAssetInfo({ id }, { headers: asBearerAuth(accessToken) }),

  deleteAssets: (accessToken: string, ids: string[]) =>
    deleteAssets({ assetBulkDeleteDto: { ids } }, { headers: asBearerAuth(accessToken) }),

  createPerson: async (accessToken: string, dto?: PersonCreateDto) => {
    const person = await createPerson({ personCreateDto: dto || {} }, { headers: asBearerAuth(accessToken) });
    await utils.setPersonThumbnail(person.id);

    return person;
  },

  createFace: async ({ assetId, personId }: { assetId: string; personId: string }) => {
    if (!client) {
      return;
    }

    const vector = Array.from({ length: 512 }, Math.random);
    const embedding = `[${vector.join(',')}]`;

    await client.query('INSERT INTO asset_faces ("assetId", "personId", "embedding") VALUES ($1, $2, $3)', [
      assetId,
      personId,
      embedding,
    ]);
  },

  setPersonThumbnail: async (personId: string) => {
    if (!client) {
      return;
    }

    await client.query(`UPDATE "person" set "thumbnailPath" = '/my/awesome/thumbnail.jpg' where "id" = $1`, [personId]);
  },

  createSharedLink: (accessToken: string, dto: SharedLinkCreateDto) =>
    createSharedLink({ sharedLinkCreateDto: dto }, { headers: asBearerAuth(accessToken) }),

  createLibrary: (accessToken: string, dto: CreateLibraryDto) =>
    createLibrary({ createLibraryDto: dto }, { headers: asBearerAuth(accessToken) }),

  validateLibrary: (accessToken: string, id: string, dto: ValidateLibraryDto) =>
    validate({ id, validateLibraryDto: dto }, { headers: asBearerAuth(accessToken) }),

  setAuthCookies: async (context: BrowserContext, accessToken: string) =>
    await context.addCookies([
      {
        name: 'immich_access_token',
        value: accessToken,
        domain: '127.0.0.1',
        path: '/',
        expires: 1_742_402_728,
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
      {
        name: 'immich_auth_type',
        value: 'password',
        domain: '127.0.0.1',
        path: '/',
        expires: 1_742_402_728,
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
      {
        name: 'immich_is_authenticated',
        value: 'true',
        domain: '127.0.0.1',
        path: '/',
        expires: 1_742_402_728,
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ]),

  cliLogin: async () => {
    const admin = await utils.adminSetup();
    const key = await utils.createApiKey(admin.accessToken);
    await immichCli(['login-key', app, `${key.secret}`]);
    return key.secret;
  },
};

utils.setApiEndpoint();

if (!existsSync(`${testAssetDir}/albums`)) {
  throw new Error(
    `Test assets not found. Please checkout https://github.com/immich-app/test-assets into ${testAssetDir} before testing`,
  );
}
