import {
  AddUsersDto,
  AlbumResponseDto,
  AlbumUserRole,
  AssetMediaCreateDto,
  AssetMediaResponseDto,
  AssetResponseDto,
  AssetVisibility,
  CreateAlbumDto,
  CreateLibraryDto,
  JobCreateDto,
  MaintenanceAction,
  ManualJobName,
  MetadataSearchDto,
  Permission,
  PersonCreateDto,
  QueueCommandDto,
  QueueName,
  QueuesResponseLegacyDto,
  SharedLinkCreateDto,
  SharedSpaceCreateDto,
  SharedSpaceMemberCreateDto,
  SharedSpaceResponseDto,
  TagResponseDto,
  UpdateLibraryDto,
  UserAdminCreateDto,
  UserPreferencesUpdateDto,
  ValidateLibraryDto,
  addAssets as addSpaceAssets,
  addMember as addSpaceMember,
  addUsersToAlbum,
  createAlbum,
  createApiKey,
  createJob,
  createLibrary,
  createPartner,
  createPerson,
  createSharedLink,
  createSpace,
  createStack,
  createUserAdmin,
  deleteAssets,
  deleteDatabaseBackup,
  getAssetInfo,
  getConfig,
  getConfigDefaults,
  getQueuesLegacy,
  listDatabaseBackups,
  login,
  markSpaceViewed,
  runQueueCommandLegacy,
  scanLibrary,
  searchAssets,
  setBaseUrl,
  setMaintenanceMode,
  signUpAdmin,
  tagAssets,
  updateAdminOnboarding,
  updateAlbumUser,
  updateAssets,
  updateConfig,
  updateLibrary,
  updateMyPreferences,
  updateSpace,
  upsertTags,
  validate,
} from '@immich/sdk';
import { BrowserContext, Page } from '@playwright/test';
import { exec, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { setTimeout as setAsyncTimeout } from 'node:timers/promises';
import { promisify } from 'node:util';
import { createGzip } from 'node:zlib';
import pg from 'pg';
import { io, type Socket } from 'socket.io-client';
import { loginDto, signupDto } from 'src/fixtures';
import { makeRandomImage } from 'src/generators';
import request from 'supertest';
import { playwrightDbHost, playwrightHost, playwriteBaseUrl } from '../playwright.config';

export type { Emitter } from '@socket.io/component-emitter';

type CommandResponse = { stdout: string; stderr: string; exitCode: number | null };
type EventType = 'assetUpload' | 'assetUpdate' | 'assetDelete' | 'userDelete' | 'assetHidden';
type WaitOptions = { event: EventType; id?: string; total?: number; timeout?: number };
type AdminSetupOptions = { onboarding?: boolean };
type FileData = { bytes?: Buffer; filename: string };

const dbUrl = `postgres://postgres:postgres@${playwrightDbHost}:5435/immich`;
export const baseUrl = playwriteBaseUrl;
export const shareUrl = `${baseUrl}/share`;
export const app = `${baseUrl}/api`;
// TODO move test assets into e2e/assets
export const testAssetDir = resolve(import.meta.dirname, '../test-assets');
export const testAssetDirInternal = '/test-assets';
export const tempDir = tmpdir();
export const asBearerAuth = (accessToken: string) => ({ Authorization: `Bearer ${accessToken}` });
export const asKeyAuth = (key: string) => ({ 'x-api-key': key });
export const immichCli = (args: string[]) =>
  executeCommand('pnpm', ['exec', 'immich', '-d', `/${tempDir}/immich/`, ...args], { cwd: '../cli' }).promise;
export const dockerExec = (args: string[]) =>
  executeCommand('docker', ['exec', '-i', 'immich-e2e-server', '/bin/bash', '-c', args.join(' ')]);
export const immichAdmin = (args: string[]) => dockerExec([`immich-admin ${args.join(' ')}`]);
export const specialCharStrings = ["'", '"', ',', '{', '}', '*'];
export const TEN_TIMES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const executeCommand = (command: string, args: string[], options?: { cwd?: string }) => {
  let _resolve: (value: CommandResponse) => void;
  const promise = new Promise<CommandResponse>((resolve) => (_resolve = resolve));
  const child = spawn(command, args, { stdio: 'pipe', cwd: options?.cwd });

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

const isRetryableError = (error: any) =>
  error?.code === '40P01' || // deadlock
  error?.message?.includes('terminated') ||
  error?.message?.includes('Connection') ||
  error?.message?.includes('ECONNREFUSED');

export const utils = {
  connectDatabase: async () => {
    if (!client) {
      client = new pg.Client(dbUrl);
      client.on('end', () => (client = null));
      client.on('error', () => (client = null));
      await client.connect();
    }

    return client;
  },

  disconnectDatabase: async () => {
    if (client) {
      await client.end();
    }
  },

  resetDatabase: async (tables?: string[]) => {
    client = await utils.connectDatabase();

    tables = tables || [
      // TODO e2e test for deleting a stack, since it is quite complex
      'stack',
      'library',
      'shared_link',
      'person',
      'album',
      'asset',
      'asset_face',
      'activity',
      'api_key',
      'session',
      'user',
      'system_metadata',
      'tag',
      'user_group',
    ];

    const truncateTables = tables.filter((table) => table !== 'system_metadata');
    const sql: string[] = [];

    if (truncateTables.length > 0) {
      sql.push(`TRUNCATE "${truncateTables.join('", "')}" CASCADE;`);
    }

    if (tables.includes('system_metadata')) {
      sql.push(`DELETE FROM "system_metadata" where "key" NOT IN ('reverse-geocoding-state', 'system-flags');`);
    }

    const query = sql.join('\n');
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await client.query(query);
        return;
      } catch (error: any) {
        if (isRetryableError(error) && attempt < maxRetries) {
          // Force reconnect on connection errors
          try {
            await client.end();
          } catch {
            // ignore cleanup errors
          }
          client = null;
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
          client = await utils.connectDatabase();
          continue;
        }
        console.error('Failed to reset database', error);
        throw error;
      }
    }
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

  createSpace: (accessToken: string, dto: SharedSpaceCreateDto) =>
    createSpace({ sharedSpaceCreateDto: dto }, { headers: asBearerAuth(accessToken) }),

  addSpaceMember: (accessToken: string, spaceId: string, dto: SharedSpaceMemberCreateDto) =>
    addSpaceMember({ id: spaceId, sharedSpaceMemberCreateDto: dto }, { headers: asBearerAuth(accessToken) }),

  addSpaceAssets: (accessToken: string, spaceId: string, assetIds: string[]) =>
    addSpaceAssets({ id: spaceId, sharedSpaceAssetAddDto: { assetIds } }, { headers: asBearerAuth(accessToken) }),

  updateSpace: (accessToken: string, spaceId: string, dto: { thumbnailAssetId?: string; name?: string }) =>
    updateSpace({ id: spaceId, sharedSpaceUpdateDto: dto }, { headers: asBearerAuth(accessToken) }),

  markSpaceViewed: (accessToken: string, spaceId: string) =>
    markSpaceViewed({ id: spaceId }, { headers: asBearerAuth(accessToken) }),

  createAsset: async (
    accessToken: string,
    dto?: Partial<Omit<AssetMediaCreateDto, 'assetData' | 'sidecarData'>> & {
      assetData?: FileData;
      sidecarData?: FileData;
    },
  ) => {
    const _dto = {
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

  renameImageFile: (oldPath: string, newPath: string) => {
    if (!existsSync(oldPath)) {
      return;
    }

    renameSync(oldPath, newPath);
  },

  removeDirectory: (path: string) => {
    if (!existsSync(path)) {
      return;
    }

    rmSync(path, { recursive: true });
  },

  getSystemConfig: (accessToken: string) => getConfig({ headers: asBearerAuth(accessToken) }),

  getAssetInfo: (accessToken: string, id: string) => getAssetInfo({ id }, { headers: asBearerAuth(accessToken) }),

  searchAssets: async (accessToken: string, dto: MetadataSearchDto) => {
    return searchAssets({ metadataSearchDto: dto }, { headers: asBearerAuth(accessToken) });
  },

  archiveAssets: (accessToken: string, ids: string[]) =>
    updateAssets(
      { assetBulkUpdateDto: { ids, visibility: AssetVisibility.Archive } },
      { headers: asBearerAuth(accessToken) },
    ),

  deleteAssets: (accessToken: string, ids: string[]) =>
    deleteAssets({ assetBulkDeleteDto: { ids } }, { headers: asBearerAuth(accessToken) }),

  createPerson: async (accessToken: string, dto?: PersonCreateDto) => {
    const person = await createPerson({ personCreateDto: dto || {} }, { headers: asBearerAuth(accessToken) });
    await utils.setPersonThumbnail(person.id);

    return person;
  },

  createFace: async ({ assetId, personId }: { assetId: string; personId: string }): Promise<string> => {
    if (!client) {
      throw new Error('Database client not connected');
    }

    const result = await client.query(
      `
      WITH inserted_face AS (
        INSERT INTO asset_face ("assetId", "personId")
        VALUES ($1, $2)
        RETURNING id
      ),
      person_row AS (
        SELECT id, "identityId", type
        FROM "person"
        WHERE id = $2
      ),
      inserted_identity AS (
        INSERT INTO "face_identity" ("type", "representativeFaceId")
        SELECT type, (SELECT id FROM inserted_face)
        FROM person_row
        WHERE "identityId" IS NULL
        RETURNING id
      ),
      resolved_identity AS (
        SELECT COALESCE((SELECT "identityId" FROM person_row), (SELECT id FROM inserted_identity)) AS id
      ),
      updated_person AS (
        UPDATE "person"
        SET
          "identityId" = (SELECT id FROM resolved_identity),
          "faceAssetId" = COALESCE("faceAssetId", (SELECT id FROM inserted_face))
        WHERE id = $2
      ),
      updated_identity AS (
        UPDATE "face_identity"
        SET "representativeFaceId" = COALESCE("representativeFaceId", (SELECT id FROM inserted_face))
        WHERE id = (SELECT id FROM resolved_identity)
      )
      INSERT INTO "face_identity_face" ("assetFaceId", "identityId", "source")
      SELECT (SELECT id FROM inserted_face), (SELECT id FROM resolved_identity), 'manual'
      RETURNING "assetFaceId" AS id
      `,
      [assetId, personId],
    );
    return result.rows[0].id as string;
  },

  setPersonThumbnail: async (personId: string) => {
    if (!client) {
      return;
    }

    await client.query(`UPDATE "person" set "thumbnailPath" = '/my/awesome/thumbnail.jpg' where "id" = $1`, [personId]);
  },

  createPet: async (ownerId: string, species: string, name?: string) => {
    if (!client) {
      throw new Error('Database client not connected');
    }

    const result = await client.query(
      `INSERT INTO "person" ("ownerId", "type", "species", "name", "thumbnailPath")
       VALUES ($1, 'pet', $2, $3, '/my/awesome/thumbnail.jpg')
       RETURNING "id"`,
      [ownerId, species, name ?? species],
    );

    return result.rows[0].id as string;
  },

  createSpacePerson: async (
    spaceId: string,
    name: string,
    ownerId: string,
    assetId: string,
    options?: { type?: 'person' | 'pet' },
  ): Promise<{ globalPersonId: string; spacePersonId: string; faceId: string }> => {
    if (!client) {
      throw new Error('Database client not connected');
    }

    // All 4 inserts are wrapped in a single transaction to avoid a race with the
    // background SharedSpacePersonDedup job. That job runs after every asset-add
    // on the FacialRecognition queue and calls deleteOrphanedPersons, which
    // deletes any shared_space_person with no shared_space_person_face rows.
    // Without a transaction, on slow runners (arm) the dedup job can fire between
    // steps 3 and 4 and hard-delete the just-created shared_space_person, causing
    // step 4's FK insert to fail with shared_space_person_face_personId_fkey.
    const spaceType = options?.type ?? 'person';
    try {
      await client.query('BEGIN');

      // 1. Create a global person row with a non-empty thumbnailPath. The shared-space
      // listing query at shared-space.repository.ts:512-513 filters on
      // `person.thumbnailPath IS NOT NULL AND != ''` (the fork's "minFaces gate"); without
      // a value here, every getPersonsBySpaceId call would return empty.
      const personResult = await client.query(
        `INSERT INTO "person" ("ownerId", "name", "thumbnailPath")
         VALUES ($1, $2, '/my/awesome/thumbnail.jpg') RETURNING id`,
        [ownerId, name],
      );
      const globalPersonId = personResult.rows[0].id as string;

      // 2. Create a face row linking the asset to the global person.
      const faceResult = await client.query(
        `INSERT INTO "asset_face" ("assetId", "personId") VALUES ($1, $2) RETURNING id`,
        [assetId, globalPersonId],
      );
      const faceId = faceResult.rows[0].id as string;

      // 3. Create the shared_space_person row pointing at the face as its representative.
      const spacePersonResult = await client.query(
        `INSERT INTO shared_space_person
           ("spaceId", name, "isHidden", "faceCount", "assetCount", "representativeFaceId", "type")
         VALUES ($1, $2, false, 1, 1, $3, $4) RETURNING id`,
        [spaceId, name, faceId, spaceType],
      );
      const spacePersonId = spacePersonResult.rows[0].id as string;

      // 4. Insert the load-bearing junction row. shared-space.repository.ts queries
      // getPersonAssetIds, reassignPersonFaces, isPersonFaceAssigned, getPersonsForDedup,
      // the faceCount/assetCount denormalization (lines 693-708), and the
      // takenAfter/takenBefore EXISTS subquery (lines 522-528) all traverse this table.
      // Without it, T07-T14 queries return empty.
      await client.query(`INSERT INTO "shared_space_person_face" ("personId", "assetFaceId") VALUES ($1, $2)`, [
        spacePersonId,
        faceId,
      ]);

      await client.query('COMMIT');
      return { globalPersonId, spacePersonId, faceId };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    }
  },

  createSharedLink: (accessToken: string, dto: SharedLinkCreateDto) =>
    createSharedLink({ sharedLinkCreateDto: dto }, { headers: asBearerAuth(accessToken) }),

  createLibrary: (accessToken: string, dto: CreateLibraryDto) =>
    createLibrary({ createLibraryDto: dto }, { headers: asBearerAuth(accessToken) }),

  validateLibrary: (accessToken: string, id: string, dto: ValidateLibraryDto) =>
    validate({ id, validateLibraryDto: dto }, { headers: asBearerAuth(accessToken) }),

  updateLibrary: (accessToken: string, id: string, dto: UpdateLibraryDto) =>
    updateLibrary({ id, updateLibraryDto: dto }, { headers: asBearerAuth(accessToken) }),

  createPartner: (accessToken: string, id: string) =>
    createPartner({ partnerCreateDto: { sharedWithId: id } }, { headers: asBearerAuth(accessToken) }),

  updateMyPreferences: (accessToken: string, userPreferencesUpdateDto: UserPreferencesUpdateDto) =>
    updateMyPreferences({ userPreferencesUpdateDto }, { headers: asBearerAuth(accessToken) }),

  createStack: (accessToken: string, assetIds: string[]) =>
    createStack({ stackCreateDto: { assetIds } }, { headers: asBearerAuth(accessToken) }),

  setAssetDuplicateId: (accessToken: string, assetId: string, duplicateId: string | null) =>
    updateAssets({ assetBulkUpdateDto: { ids: [assetId], duplicateId } }, { headers: asBearerAuth(accessToken) }),

  upsertTags: (accessToken: string, tags: string[]) =>
    upsertTags({ tagUpsertDto: { tags } }, { headers: asBearerAuth(accessToken) }),

  tagAssets: (accessToken: string, tagId: string, assetIds: string[]) =>
    tagAssets({ id: tagId, bulkIdsDto: { ids: assetIds } }, { headers: asBearerAuth(accessToken) }),

  createJob: async (accessToken: string, jobCreateDto: JobCreateDto) =>
    createJob({ jobCreateDto }, { headers: asBearerAuth(accessToken) }),

  queueCommand: async (accessToken: string, name: QueueName, queueCommandDto: QueueCommandDto) =>
    runQueueCommandLegacy({ name, queueCommandDto }, { headers: asBearerAuth(accessToken) }),

  setAuthCookies: async (context: BrowserContext, accessToken: string, domain = playwrightHost) =>
    await context.addCookies([
      {
        name: 'immich_access_token',
        value: accessToken,
        domain,
        path: '/',
        expires: 2_058_028_213,
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
      {
        name: 'immich_auth_type',
        value: 'password',
        domain,
        path: '/',
        expires: 2_058_028_213,
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
      {
        name: 'immich_is_authenticated',
        value: 'true',
        domain,
        path: '/',
        expires: 2_058_028_213,
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ]),

  setMaintenanceAuthCookie: async (context: BrowserContext, token: string, domain = '127.0.0.1') =>
    await context.addCookies([
      {
        name: 'immich_maintenance_token',
        value: token,
        domain,
        path: '/',
        expires: 2_058_028_213,
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ]),

  enterMaintenance: async (accessToken: string) => {
    let setCookie: string[] | undefined;

    await setMaintenanceMode(
      {
        setMaintenanceModeDto: {
          action: MaintenanceAction.Start,
        },
      },
      {
        headers: asBearerAuth(accessToken),
        fetch: (...args: Parameters<typeof fetch>) =>
          fetch(...args).then((response) => {
            setCookie = response.headers.getSetCookie();
            return response;
          }),
      },
    );

    return setCookie;
  },

  resetTempFolder: () => {
    rmSync(`${testAssetDir}/temp`, { recursive: true, force: true });
    mkdirSync(`${testAssetDir}/temp`, { recursive: true });
  },

  async move(source: string, dest: string) {
    return executeCommand('docker', ['exec', 'immich-e2e-server', 'mv', source, dest]).promise;
  },

  createBackup: async (accessToken: string) => {
    await utils.createJob(accessToken, {
      name: ManualJobName.BackupDatabase,
    });

    return utils.poll(
      () => request(app).get('/admin/database-backups').set('Authorization', `Bearer ${accessToken}`),
      ({ status, body }) => status === 200 && body.backups.length === 1,
      ({ body }) => body.backups[0].filename,
    );
  },

  resetBackups: async (accessToken: string) => {
    const { backups } = await listDatabaseBackups({ headers: asBearerAuth(accessToken) });

    const backupFiles = backups.map((b) => b.filename);
    await deleteDatabaseBackup(
      { databaseBackupDeleteDto: { backups: backupFiles } },
      { headers: asBearerAuth(accessToken) },
    );
  },

  prepareTestBackup: async (generate: 'empty' | 'corrupted') => {
    const dir = await mkdtemp(join(tmpdir(), 'test-'));
    const fn = join(dir, 'file');

    const sql = Readable.from(generate === 'corrupted' ? 'IM CORRUPTED;' : 'SELECT 1;');
    const gzip = createGzip();
    const writeStream = createWriteStream(fn);
    await pipeline(sql, gzip, writeStream);

    await executeCommand('docker', ['cp', fn, `immich-e2e-server:/data/backups/development-${generate}.sql.gz`])
      .promise;
  },

  resetAdminConfig: async (accessToken: string) => {
    const defaultConfig = await getConfigDefaults({ headers: asBearerAuth(accessToken) });
    await updateConfig({ systemConfigDto: defaultConfig }, { headers: asBearerAuth(accessToken) });
  },

  isQueueEmpty: async (accessToken: string, queue: keyof QueuesResponseLegacyDto) => {
    const queues = await getQueuesLegacy({ headers: asBearerAuth(accessToken) });
    const jobCounts = queues[queue].jobCounts;
    return !jobCounts.active && !jobCounts.waiting;
  },

  waitForQueueFinish: (accessToken: string, queue: keyof QueuesResponseLegacyDto, ms?: number) => {
    // eslint-disable-next-line no-async-promise-executor
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

  waitForQueuePaused: (accessToken: string, queue: keyof QueuesResponseLegacyDto, ms?: number) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<void>(async (resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timed out waiting for queue to pause')), ms || 10_000);

      while (true) {
        const queues = await getQueuesLegacy({ headers: asBearerAuth(accessToken) });
        if (queues[queue].queueStatus.isPaused) {
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

  scan: async (accessToken: string, id: string) => {
    await scanLibrary({ id }, { headers: asBearerAuth(accessToken) });

    await utils.waitForQueueFinish(accessToken, 'library');
    await utils.waitForQueueFinish(accessToken, 'sidecar');
    await utils.waitForQueueFinish(accessToken, 'metadataExtraction');
  },

  async poll<T>(cb: () => Promise<T>, validate: (value: T) => boolean, map?: (value: T) => any) {
    let timeout = 0;
    while (true) {
      try {
        const data = await cb();
        if (validate(data)) {
          return map ? map(data) : data;
        }
        timeout++;
        if (timeout >= 10) {
          throw 'Could not clean up test.';
        }
        await new Promise((resolve) => setTimeout(resolve, 5e2));
      } catch {
        // no-op
      }
    }
  },

  // ---------------------------------------------------------------------------
  // cmdk palette helpers (Tasks 25–30 of the cmdk v1.1 plan)
  //
  // These compose the granular utils.* wrappers above to set up multi-section
  // palette fixtures (albums, spaces, people, places, tags) without each
  // E2E spec re-deriving the same setup. The "all section types" helper has
  // a few caveats called out inline.
  // ---------------------------------------------------------------------------

  cmdkSeedAlbums: (accessToken: string, names: string[]): Promise<AlbumResponseDto[]> =>
    Promise.all(names.map((albumName) => utils.createAlbum(accessToken, { albumName }))),

  cmdkSeedSpaces: (
    accessToken: string,
    names: string[],
    dto?: Omit<SharedSpaceCreateDto, 'name'>,
  ): Promise<SharedSpaceResponseDto[]> =>
    Promise.all(names.map((name) => utils.createSpace(accessToken, { name, ...dto }))),

  // Compound fixture: an admin (caller-supplied) seeds 2 albums + 2 spaces,
  // both with "Hawaii" prefixes so a single 'hawaii' query in the palette
  // exercises the mixed-section path (Task 25).
  cmdkSetupAlbumsAndSpaces: async (
    accessToken: string,
  ): Promise<{ albums: AlbumResponseDto[]; spaces: SharedSpaceResponseDto[] }> => {
    const albums = await utils.cmdkSeedAlbums(accessToken, ['Hawaii Beach', 'Hawaii Mountains']);
    const spaces = await utils.cmdkSeedSpaces(accessToken, ['Hawaii Family', 'Hawaii Friends']);
    return { albums, spaces };
  },

  // Inject a recent entry pointing at a space id that doesn't exist server-side,
  // so activation triggers the stale-cache → toast → removal path (Task 28).
  // The localStorage key matches cmdk-recent.ts's STORAGE_KEY_PREFIX scheme.
  // Use a well-formed-but-unallocated UUID so the server's UUIDParamDto accepts
  // the param and the controller actually reaches `requireAccess` — Gallery's
  // requireAccess middleware raises BadRequestException (HTTP 400) for both
  // "row missing" and "user lacks access", which the activate handler treats
  // identically to 404/403. A literal 'nonexistent' string would also 400, but
  // earlier (UUID validation), bypassing the access check we want to exercise.
  cmdkSeedRecentWithNonexistentSpace: async (page: Page, userId: string): Promise<void> => {
    await page.evaluate(
      ({ userId }) => {
        const ghostSpaceId = '00000000-0000-0000-0000-000000000000';
        const entry = {
          kind: 'space',
          id: `space:${ghostSpaceId}`,
          spaceId: ghostSpaceId,
          label: 'Ghost Space',
          colorHex: null,
          lastUsed: Date.now(),
        };
        localStorage.setItem(`cmdk.recent:${userId}`, JSON.stringify([entry]));
      },
      { userId },
    );
  },

  // Seed at least one match in every entity section the palette renders.
  //
  // Coverage notes:
  // - photos: a real upload, named with the query so filename mode hits.
  // - albums + spaces + tags: pure SDK creates, query is in the name.
  // - places: relies on reverse geocoding of GPS exif from thompson-springs.jpg
  //   (the same fixture used by metadata/gps-position tests). The geocoded
  //   country/city is fixed (Utah, US), so the caller's query won't generally
  //   match the place name — Task 29's order assertion treats places as best-
  //   effort. If the caller needs a guaranteed place match, they can fall back
  //   to checking that the photo upload populated *some* place rather than
  //   one whose label contains `query`.
  // - people: createPerson works without ML (face detection skipped), but the
  //   palette filters on faceCount > 0, so a bare API-created person won't
  //   surface in search results. We seed via createPerson for consistency, but
  //   Task 29 should treat people as best-effort the same way places are.
  cmdkSeedAllSectionTypes: async (
    accessToken: string,
    query: string = 'testmatch',
  ): Promise<{
    photo: AssetMediaResponseDto;
    albums: AlbumResponseDto[];
    spaces: SharedSpaceResponseDto[];
    person: { id: string };
    tags: TagResponseDto[];
  }> => {
    // Upload a GPS-tagged photo. The filename embeds the query so filename mode
    // matches; metadata extraction populates exif (city/country) for places.
    const gpsImagePath = `${testAssetDir}/metadata/gps-position/thompson-springs.jpg`;
    const photo = await utils.createAsset(accessToken, {
      assetData: {
        bytes: readFileSync(gpsImagePath),
        filename: `${query}-photo.jpg`,
      },
    });
    // Drain metadataExtraction so EXIF (and reverse-geocoded place) is committed
    // before the test queries the palette. Per feedback_e2e_tag_suggestions_arm_flake,
    // tag/rating mutations race the queue otherwise. Caller token must have queue
    // read access (admin); for non-admin callers, switch to expect.poll.
    await utils.waitForQueueFinish(accessToken, 'metadataExtraction');

    const albums = await utils.cmdkSeedAlbums(accessToken, [`${query} Album`]);
    const spaces = await utils.cmdkSeedSpaces(accessToken, [`${query} Space`]);

    // People: API-created without a face will be filtered out by the palette's
    // faceCount > 0 gate. We seed it for ordering completeness; tests that
    // assert a People row should call utils.createSpacePerson or build a face
    // chain themselves (see feedback_e2e_space_person_face_chain).
    const person = await utils.createPerson(accessToken, { name: `${query} Person` });

    const tags = await utils.upsertTags(accessToken, [`${query}-tag`]);

    return { photo, albums, spaces, person, tags };
  },

  // Owner creates an album + invites buddy as viewer. Used by Task 30 to assert
  // that the same album doesn't duplicate-render across owned and shared lists.
  cmdkCreateAndShareAlbum: async (
    ownerAccessToken: string,
    buddyUserId: string,
    albumName: string,
  ): Promise<AlbumResponseDto> => {
    const album = await utils.createAlbum(ownerAccessToken, { albumName });
    const addUsersDto: AddUsersDto = {
      albumUsers: [{ userId: buddyUserId, role: AlbumUserRole.Viewer }],
    };
    await addUsersToAlbum({ id: album.id, addUsersDto }, { headers: asBearerAuth(ownerAccessToken) });
    return album;
  },
};

utils.initSdk();

if (!existsSync(`${testAssetDir}/albums`)) {
  throw new Error(
    `Test assets not found. Please checkout https://github.com/immich-app/test-assets into ${testAssetDir} before testing`,
  );
}
