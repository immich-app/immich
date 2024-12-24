import {
  AllJobStatusResponseDto,
  AssetMediaCreateDto,
  AssetMediaResponseDto,
  AssetResponseDto,
  CheckExistingAssetsDto,
  CreateAlbumDto,
  CreateLibraryDto,
  MetadataSearchDto,
  Permission,
  PersonCreateDto,
  SharedLinkCreateDto,
  UserAdminCreateDto,
  UserPreferencesUpdateDto,
  ValidateLibraryDto,
  checkExistingAssets,
  createAlbum,
  createApiKey,
  createLibrary,
  createPartner,
  createPerson,
  createSharedLink,
  createStack,
  createUserAdmin,
  deleteAssets,
  getAllJobsStatus,
  getAssetInfo,
  getConfigDefaults,
  login,
  searchAssets,
  setBaseUrl,
  signUpAdmin,
  tagAssets,
  updateAdminOnboarding,
  updateAlbumUser,
  updateAssets,
  updateConfig,
  updateMyPreferences,
  upsertTags,
  validate,
} from '@immich/sdk';
import { BrowserContext } from '@playwright/test';
import { exec, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path, { dirname } from 'node:path';
import { setTimeout as setAsyncTimeout } from 'node:timers/promises';
import { promisify } from 'node:util';
import pg from 'pg';
import { io, type Socket } from 'socket.io-client';
import { loginDto, signupDto } from 'src/fixtures';
import { makeRandomImage } from 'src/generators';
import request from 'supertest';

type CommandResponse = { stdout: string; stderr: string; exitCode: number | null };
type EventType = 'assetUpload' | 'assetUpdate' | 'assetDelete' | 'userDelete' | 'assetHidden';
type WaitOptions = { event: EventType; id?: string; total?: number; timeout?: number };
type AdminSetupOptions = { onboarding?: boolean };
type FileData = { bytes?: Buffer; filename: string };

const dbUrl = 'postgres://postgres:postgres@127.0.0.1:5435/immich';
export const baseUrl = 'http://127.0.0.1:2285';
export const shareUrl = `${baseUrl}/share`;
export const app = `${baseUrl}/api`;
// TODO move test assets into e2e/assets
export const testAssetDir = path.resolve('./test-assets');
export const testAssetDirInternal = '/test-assets';
export const tempDir = tmpdir();
export const asBearerAuth = (accessToken: string) => ({ Authorization: `Bearer ${accessToken}` });
export const asKeyAuth = (key: string) => ({ 'x-api-key': key });
export const immichCli = (args: string[]) =>
  executeCommand('node', ['node_modules/.bin/immich', '-d', `/${tempDir}/immich/`, ...args]).promise;
export const immichAdmin = (args: string[]) =>
  executeCommand('docker', ['exec', '-i', 'immich-e2e-server', '/bin/bash', '-c', `immich-admin ${args.join(' ')}`]);
export const specialCharStrings = ["'", '"', ',', '{', '}', '*'];

const executeCommand = (command: string, args: string[]) => {
  let _resolve: (value: CommandResponse) => void;
  const promise = new Promise<CommandResponse>((resolve) => (_resolve = resolve));
  const child = spawn(command, args, { stdio: 'pipe' });

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

  return { promise, child };
};

let client: pg.Client | null = null;

const events: Record<EventType, Set<string>> = {
  assetHidden: new Set<string>(),
  assetUpload: new Set<string>(),
  assetUpdate: new Set<string>(),
  assetDelete: new Set<string>(),
  userDelete: new Set<string>(),
};

const idCallbacks: Record<string, () => void> = {};
const countCallbacks: Record<string, { count: number; callback: () => void }> = {};

const execPromise = promisify(exec);

const onEvent = ({ event, id }: { event: EventType; id: string }) => {
  // console.log(`Received event: ${event} [id=${id}]`);
  const set = events[event];
  set.add(id);

  const idCallback = idCallbacks[id];
  if (idCallback) {
    idCallback();
    delete idCallbacks[id];
  }

  const item = countCallbacks[event];
  if (item) {
    const { count, callback: countCallback } = item;

    if (set.size >= count) {
      countCallback();
      delete countCallbacks[event];
    }
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
        // TODO e2e test for deleting a stack, since it is quite complex
        'asset_stack',
        'libraries',
        'shared_links',
        'person',
        'albums',
        'assets',
        'asset_faces',
        'activity',
        'api_keys',
        'sessions',
        'users',
        'system_metadata',
        'tags',
      ];

      const sql: string[] = [];

      for (const table of tables) {
        if (table === 'system_metadata') {
          sql.push(`DELETE FROM "system_metadata" where "key" NOT IN ('reverse-geocoding-state', 'system-flags');`);
        } else {
          sql.push(`DELETE FROM ${table} CASCADE;`);
        }
      }

      await client.query(sql.join('\n'));
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
        .on('on_upload_success', (data: AssetResponseDto) => onEvent({ event: 'assetUpload', id: data.id }))
        .on('on_asset_update', (data: AssetResponseDto) => onEvent({ event: 'assetUpdate', id: data.id }))
        .on('on_asset_hidden', (assetId: string) => onEvent({ event: 'assetHidden', id: assetId }))
        .on('on_asset_delete', (assetId: string) => onEvent({ event: 'assetDelete', id: assetId }))
        .on('on_user_delete', (userId: string) => onEvent({ event: 'userDelete', id: userId }))
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

  resetEvents: () => {
    for (const set of Object.values(events)) {
      set.clear();
    }
  },

  waitForWebsocketEvent: ({ event, id, total: count, timeout: ms }: WaitOptions): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      if (!id && !count) {
        reject(new Error('id or count must be provided for waitForWebsocketEvent'));
      }

      const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${event} event`)), ms || 10_000);
      const type = id ? `id=${id}` : `count=${count}`;
      console.log(`Waiting for ${event} [${type}]`);
      const set = events[event];
      const onId = () => {
        clearTimeout(timeout);
        resolve();
      };
      if ((id && set.has(id)) || (count && set.size >= count)) {
        onId();
        return;
      }

      if (id) {
        idCallbacks[id] = onId;
      }

      if (count) {
        countCallbacks[event] = {
          count,
          callback: onId,
        };
      }
    });
  },

  initSdk: () => {
    setBaseUrl(app);
  },

  adminSetup: async (options?: AdminSetupOptions) => {
    options = options || { onboarding: true };

    await signUpAdmin({ signUpDto: signupDto.admin });
    const response = await login({ loginCredentialDto: loginDto.admin });
    if (options.onboarding) {
      await updateAdminOnboarding(
        { adminOnboardingUpdateDto: { isOnboarded: true } },
        { headers: asBearerAuth(response.accessToken) },
      );
    }
    return response;
  },

  userSetup: async (accessToken: string, dto: UserAdminCreateDto) => {
    await createUserAdmin({ userAdminCreateDto: dto }, { headers: asBearerAuth(accessToken) });
    return login({
      loginCredentialDto: { email: dto.email, password: dto.password },
    });
  },

  createApiKey: (accessToken: string, permissions: Permission[]) => {
    return createApiKey({ apiKeyCreateDto: { name: 'e2e', permissions } }, { headers: asBearerAuth(accessToken) });
  },

  createAlbum: (accessToken: string, dto: CreateAlbumDto) =>
    createAlbum({ createAlbumDto: dto }, { headers: asBearerAuth(accessToken) }),

  updateAlbumUser: (accessToken: string, args: Parameters<typeof updateAlbumUser>[0]) =>
    updateAlbumUser(args, { headers: asBearerAuth(accessToken) }),

  createAsset: async (
    accessToken: string,
    dto?: Partial<Omit<AssetMediaCreateDto, 'assetData' | 'sidecarData'>> & {
      assetData?: FileData;
      sidecarData?: FileData;
    },
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

    if (dto?.assetData?.bytes) {
      console.log(`Uploading ${filename}`);
    }

    const builder = request(app)
      .post(`/assets`)
      .attach('assetData', assetData, filename)
      .set('Authorization', `Bearer ${accessToken}`);

    if (dto?.sidecarData?.bytes) {
      void builder.attach('sidecarData', dto.sidecarData.bytes, dto.sidecarData.filename);
    }

    for (const [key, value] of Object.entries(_dto)) {
      void builder.field(key, String(value));
    }

    const { body } = await builder;

    return body as AssetMediaResponseDto;
  },

  replaceAsset: async (
    accessToken: string,
    assetId: string,
    dto?: Partial<Omit<AssetMediaCreateDto, 'assetData'>> & { assetData?: FileData },
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

    if (dto?.assetData?.bytes) {
      console.log(`Uploading ${filename}`);
    }

    const builder = request(app)
      .put(`/assets/${assetId}/original`)
      .attach('assetData', assetData, filename)
      .set('Authorization', `Bearer ${accessToken}`);

    for (const [key, value] of Object.entries(_dto)) {
      void builder.field(key, String(value));
    }

    const { body } = await builder;

    return body as AssetMediaResponseDto;
  },

  createImageFile: (path: string) => {
    if (!existsSync(dirname(path))) {
      mkdirSync(dirname(path), { recursive: true });
    }
    writeFileSync(path, makeRandomImage());
  },

  createDirectory: (path: string) => {
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true });
    }
  },

  removeImageFile: (path: string) => {
    if (!existsSync(path)) {
      return;
    }

    rmSync(path);
  },

  removeDirectory: (path: string) => {
    if (!existsSync(path)) {
      return;
    }

    rmSync(path, { recursive: true });
  },

  getAssetInfo: (accessToken: string, id: string) => getAssetInfo({ id }, { headers: asBearerAuth(accessToken) }),

  checkExistingAssets: (accessToken: string, checkExistingAssetsDto: CheckExistingAssetsDto) =>
    checkExistingAssets({ checkExistingAssetsDto }, { headers: asBearerAuth(accessToken) }),

  searchAssets: async (accessToken: string, dto: MetadataSearchDto) => {
    return searchAssets({ metadataSearchDto: dto }, { headers: asBearerAuth(accessToken) });
  },

  archiveAssets: (accessToken: string, ids: string[]) =>
    updateAssets({ assetBulkUpdateDto: { ids, isArchived: true } }, { headers: asBearerAuth(accessToken) }),

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

    await client.query('INSERT INTO asset_faces ("assetId", "personId") VALUES ($1, $2)', [assetId, personId]);
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

  createPartner: (accessToken: string, id: string) => createPartner({ id }, { headers: asBearerAuth(accessToken) }),

  updateMyPreferences: (accessToken: string, userPreferencesUpdateDto: UserPreferencesUpdateDto) =>
    updateMyPreferences({ userPreferencesUpdateDto }, { headers: asBearerAuth(accessToken) }),

  createStack: (accessToken: string, assetIds: string[]) =>
    createStack({ stackCreateDto: { assetIds } }, { headers: asBearerAuth(accessToken) }),

  upsertTags: (accessToken: string, tags: string[]) =>
    upsertTags({ tagUpsertDto: { tags } }, { headers: asBearerAuth(accessToken) }),

  tagAssets: (accessToken: string, tagId: string, assetIds: string[]) =>
    tagAssets({ id: tagId, bulkIdsDto: { ids: assetIds } }, { headers: asBearerAuth(accessToken) }),

  setAuthCookies: async (context: BrowserContext, accessToken: string, domain = '127.0.0.1') =>
    await context.addCookies([
      {
        name: 'immich_access_token',
        value: accessToken,
        domain,
        path: '/',
        expires: 1_742_402_728,
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
      {
        name: 'immich_auth_type',
        value: 'password',
        domain,
        path: '/',
        expires: 1_742_402_728,
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
      {
        name: 'immich_is_authenticated',
        value: 'true',
        domain,
        path: '/',
        expires: 1_742_402_728,
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ]),

  resetTempFolder: () => {
    rmSync(`${testAssetDir}/temp`, { recursive: true, force: true });
    mkdirSync(`${testAssetDir}/temp`, { recursive: true });
  },

  resetAdminConfig: async (accessToken: string) => {
    const defaultConfig = await getConfigDefaults({ headers: asBearerAuth(accessToken) });
    await updateConfig({ systemConfigDto: defaultConfig }, { headers: asBearerAuth(accessToken) });
  },

  isQueueEmpty: async (accessToken: string, queue: keyof AllJobStatusResponseDto) => {
    const queues = await getAllJobsStatus({ headers: asBearerAuth(accessToken) });
    const jobCounts = queues[queue].jobCounts;
    return !jobCounts.active && !jobCounts.waiting;
  },

  waitForQueueFinish: (accessToken: string, queue: keyof AllJobStatusResponseDto, ms?: number) => {
    return new Promise<void>(async (resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timed out waiting for queue to empty')), ms || 10_000);

      while (true) {
        const done = await utils.isQueueEmpty(accessToken, queue);
        if (done) {
          break;
        }
        await setAsyncTimeout(200);
      }

      clearTimeout(timeout);
      resolve();
    });
  },

  cliLogin: async (accessToken: string) => {
    const key = await utils.createApiKey(accessToken, [Permission.All]);
    await immichCli(['login', app, `${key.secret}`]);
    return key.secret;
  },
};

utils.initSdk();

if (!existsSync(`${testAssetDir}/albums`)) {
  throw new Error(
    `Test assets not found. Please checkout https://github.com/immich-app/test-assets into ${testAssetDir} before testing`,
  );
}
