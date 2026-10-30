import * as sdk from '@immich/sdk';
import { LoginResponseDto, StorageFolder } from '@immich/sdk';
import { io, Socket } from 'socket.io-client';
import { createUserDto } from 'src/fixtures';
import { app, asBearerAuth, baseUrl, utils } from 'src/utils';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('/futo-backups', () => {
  let admin: LoginResponseDto;
  let nonAdmin: LoginResponseDto;
  let requestOpts: any;
  let filename: string;

  let socket: Socket;
  let libraryId: string;

  beforeAll(async () => {
    utils.initSdk();

    await utils.resetDatabase();
    admin = await utils.adminSetup();
    nonAdmin = await utils.userSetup(admin.accessToken, createUserDto.user1);

    requestOpts = { headers: asBearerAuth(admin.accessToken) };

    await utils.resetBackups(admin.accessToken);
    await sdk.futoBackupsResetOrchestrator(requestOpts);

    socket = io(baseUrl, {
      path: '/api/futo-backups/socket.io',
      transports: ['websocket'],
      extraHeaders: asBearerAuth(admin.accessToken),
    });

    socket.onAny(console.info);
  });

  afterAll(async () => {
    socket.close();

    // trigger update for orchestrator module config
    if (libraryId) {
      await utils.deleteLibrary(admin.accessToken, libraryId);
    }
  });

  const finishedJobStatuses = new Set(['complete', 'warn', 'failed', 'cancelled', 'incomplete']);

  const waitForMessage = (type: string, matches: (payload: any) => boolean = () => true) => {
    return new Promise((resolve) => {
      const listener = (msg: string) => {
        const payload = JSON.parse(msg);
        if (payload.type !== type || !matches(payload)) {
          return;
        }

        resolve(payload);
        socket.offAny(listener);
      };

      socket.onAny(listener);
    });
  };

  describe('Orchestration Module', async () => {
    it('works', async () => {
      await expect(sdk.futoBackupsOnboardingStatus(requestOpts)).resolves.toEqual(
        expect.objectContaining({
          hasOnboardedKey: false,
          hasBackend: false,
          hasBackup: false,
          hasSchedule: false,
          hasSkippedExtraConfig: false,
        }),
      );
    });

    it('is inaccessible without admin', async () => {
      await expect(sdk.futoBackupsOnboardingStatus({ headers: asBearerAuth(nonAdmin.accessToken) })).rejects.toEqual(
        expect.objectContaining({ data: { message: expect.any(String) } }),
      );
    });

    it('is inaccessible without logging in', async () => {
      await expect(sdk.futoBackupsOnboardingStatus()).rejects.toEqual(
        expect.objectContaining({ data: { message: 'Authentication required' } }),
      );
    });
  });

  describe('Local Backup', { concurrent: false }, async () => {
    beforeAll(async () => {
      await sdk.futoBackupsImportRecoveryKey(
        {
          importRecoveryKeyRequest: {
            recoveryKey: '0'.repeat(64),
          },
        },
        requestOpts,
      );
    });

    it('configures a local backend', { concurrent: false }, async () => {
      await utils.mkFolder('/local-backend');

      await sdk.futoBackupsCreateLocalBackend(
        {
          createLocalBackendRequestDto: {
            path: '/local-backend',
          },
        },
        requestOpts,
      );
    });

    it('configures Immich backup', { concurrent: false }, async () => {
      const event = waitForMessage('IntegrationUpdate');

      await sdk.futoBackupsConfigureImmichIntegration(
        {
          configureImmichIntegrationRequestDto: {
            name: 'Immich',
            worm: false,
            cron: '0 3 * * *',
            backupConfiguration: true,
            dataFolders: [StorageFolder.Backups, StorageFolder.Upload],
            libraries: ['all'],
          },
        },
        requestOpts,
      );

      await event;

      await expect(sdk.futoBackupsGetIntegrations(requestOpts)).resolves.toEqual(
        expect.objectContaining({
          immichIntegration: expect.objectContaining({
            configuration: {
              backupConfiguration: true,
              dataFolders: ['backups', 'upload'],
              libraries: ['all'],
            },
          }),
          immichState: {
            dataFolders: expect.arrayContaining(Object.values(StorageFolder)),
            dataPath: '/data',
            // may have stale libraries from other test runs
            libraries: expect.any(Array),
          },
        }),
      );
    });

    it('updates configuration', { concurrent: false }, async () => {
      await utils.mkFolder('/test');

      ({ id: libraryId } = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        name: 'My Library',
        importPaths: ['/test'],
      }));

      await expect(sdk.futoBackupsGetIntegrations(requestOpts)).resolves.toEqual(
        expect.objectContaining({
          immichIntegration: expect.any(Object),
          immichState: expect.objectContaining({
            libraries: expect.arrayContaining([
              expect.objectContaining({
                name: 'My Library',
                importPaths: ['/test'],
              }),
            ]),
          }),
        }),
      );
    });

    it('creates a snapshot', { concurrent: false }, async () => {
      const event = waitForMessage('JobUpdate', ({ job }) => finishedJobStatuses.has(job?.status));

      const { repositories } = await sdk.futoBackupsGetRepositories(requestOpts);
      const { id } = repositories[0];

      filename = await utils.createBackup(admin.accessToken);

      await sdk.futoBackupsCreateBackup({ id }, requestOpts);
      await event;

      const { snapshots } = await sdk.futoBackupsGetSnapshots({ id }, requestOpts);
      const { id: snapshotId } = snapshots[0];

      await expect(sdk.futoBackupsGetSnapshotListing({ id, snapshot: snapshotId }, requestOpts)).resolves
        .toMatchInlineSnapshot(`
        {
          "items": [
            {
              "isDirectory": true,
              "path": "/data",
            },
            {
              "isDirectory": true,
              "path": "/test",
            },
          ],
          "parent": "/",
          "path": "/",
        }
      `);

      await expect(sdk.futoBackupsGetSnapshotListing({ id, snapshot: snapshotId, path: '/data' }, requestOpts)).resolves
        .toMatchInlineSnapshot(`
        {
          "items": [
            {
              "isDirectory": true,
              "path": "/data/backups",
            },
            {
              "isDirectory": true,
              "path": "/data/upload",
            },
          ],
          "parent": "/",
          "path": "/data",
        }
      `);

      await expect(
        sdk.futoBackupsGetSnapshotListing({ id, snapshot: snapshotId, path: '/data/backups' }, requestOpts),
      ).resolves.toEqual(
        expect.objectContaining({
          items: expect.arrayContaining([
            { isDirectory: false, path: '/data/backups/.immich' },
            { isDirectory: false, path: `/data/backups/${filename}` },
            { isDirectory: true, path: '/data/backups/yucca' },
          ]),
          parent: '/data',
          path: '/data/backups',
        }),
      );
    });
  });

  describe('Restore Local Backup', { concurrent: false }, async () => {
    let cookie: string;

    beforeAll(async () => {
      await sdk.futoBackupsResetOrchestrator(requestOpts);
      await utils.resetDatabase();
      socket.disconnect();
      await utils.disconnectDatabase();
    });

    afterAll(async () => {
      await utils.connectDatabase();
    });

    it('restores backup', { timeout: 60_000, concurrent: false }, async () => {
      const { status, headers } = await request(app).post('/admin/database-backups/start-restore').send();
      expect(status).toBe(201);
      cookie = headers['set-cookie'][0].split(';', 1)[0];

      await expect
        .poll(
          async () => {
            const { status, body } = await request(app).get('/server/config');
            expect(status).toBe(200);
            return body.maintenanceMode;
          },
          {
            interval: 500,
            timeout: 10_000,
          },
        )
        .toBeTruthy();

      const maintenanceRequestOpts = {
        headers: {
          cookie,
        },
      };

      await expect(sdk.futoBackupsGetSchedules(maintenanceRequestOpts)).resolves.toEqual({ schedules: [] });

      await sdk.futoBackupsImportRecoveryKey(
        {
          importRecoveryKeyRequest: {
            recoveryKey: '0'.repeat(64),
          },
        },
        maintenanceRequestOpts,
      );

      const {
        backend: { id: backendId },
      } = await sdk.futoBackupsCreateLocalBackend(
        {
          createLocalBackendRequestDto: {
            path: '/local-backend',
          },
        },
        maintenanceRequestOpts,
      );

      const { repositories } = await sdk.futoBackupsInspectRepositories({}, maintenanceRequestOpts);
      const { id: repositoryId, snapshots } = repositories[0];
      const { id: snapshotId } = (snapshots ?? [])[0];

      socket = io(baseUrl, {
        path: '/api/futo-backups/socket.io',
        transports: ['websocket'],
        extraHeaders: {
          cookie,
        },
      });

      const event = waitForMessage('JobUpdate', ({ job }) => finishedJobStatuses.has(job?.status));
      await sdk.futoBackupsRestoreFromPoint(
        {
          id: repositoryId,
          snapshot: snapshotId,
          backend: backendId,
          repositorySnapshotRestoreFromPointRequestDto: {
            yuccaConfig: '/data/yucca',
            include: ['/data'],
          },
        },
        maintenanceRequestOpts,
      );

      await event;
      socket.disconnect();

      const { status: restoreStatus } = await request(app).post('/admin/maintenance').set('Cookie', cookie).send({
        action: 'restore_database',
        restoreBackupFilename: filename,
      });

      expect(restoreStatus).toBe(201);

      await expect
        .poll(
          async () => {
            const { status, body } = await request(app).get('/server/config');
            expect(status).toBe(200);
            return body.maintenanceMode;
          },
          {
            interval: 500,
            timeout: 10_000,
          },
        )
        .toBeTruthy();

      const { status: status2, body } = await request(app).get('/admin/maintenance/status');
      expect(status2).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          active: true,
          action: 'restore_database',
        }),
      );

      await expect
        .poll(
          async () => {
            const { status, body } = await request(app).get('/server/config');
            expect(status).toBe(200);
            return body.maintenanceMode;
          },
          {
            interval: 500,
            timeout: 60_000,
          },
        )
        .toBeFalsy();

      await expect(sdk.futoBackupsGetSchedules(requestOpts)).resolves.toEqual({
        schedules: expect.arrayContaining([expect.objectContaining({ id: expect.any(String) })]),
      });
    });
  });
});
