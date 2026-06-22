import * as sdk from '@futo-org/backups-orchestrator-ui/sdk';
import { LoginResponseDto, StorageFolder } from '@immich/sdk';
import { io, Socket } from 'socket.io-client';
import { createUserDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, baseUrl, utils } from 'src/utils';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('/yucca', () => {
  let admin: LoginResponseDto;
  let nonAdmin: LoginResponseDto;
  let requestOpts: any;
  let filename: string;

  let socket: Socket;
  let libraryId: string;

  beforeAll(async () => {
    sdk.defaults.baseUrl = baseUrl;

    await utils.resetDatabase();
    admin = await utils.adminSetup();
    nonAdmin = await utils.userSetup(admin.accessToken, createUserDto.user1);

    requestOpts = { headers: asBearerAuth(admin.accessToken) };

    await utils.resetBackups(admin.accessToken);
    await sdk.resetOrchestrator(requestOpts);

    socket = io(baseUrl, {
      path: '/api/yucca/socket.io',
      transports: ['websocket'],
      extraHeaders: asBearerAuth(admin.accessToken),
    });

    socket.onAny(console.info);
  });

  afterAll(async () => {
    socket.close();

    // "resetDatabase" does not reinit the module config, trigger an update / clean up
    if (libraryId) {
      await utils.deleteLibrary(admin.accessToken, libraryId);
    }
  });

  const waitForMessage = (type: string) => {
    return new Promise((resolve) => {
      const listener = (msg: string) => {
        const payload = JSON.parse(msg);
        if (payload.type !== type) {
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
      await expect(sdk.onboardingStatus(requestOpts)).resolves.toEqual(
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
      await expect(sdk.onboardingStatus({ headers: asBearerAuth(nonAdmin.accessToken) })).rejects.toEqual(
        expect.objectContaining({ data: errorDto.forbidden }),
      );
    });

    it('is inaccessible without logging in', async () => {
      await expect(sdk.onboardingStatus()).rejects.toEqual(expect.objectContaining({ data: errorDto.unauthorized }));
    });
  });

  describe.sequential('Local Backup', async () => {
    beforeAll(async () => {
      await sdk.importRecoveryKey(
        {
          recoveryKey: '0'.repeat(64),
        },
        requestOpts,
      );
    });

    it.sequential('configures a local backend', async () => {
      await utils.mkFolder('/local-backend');

      await sdk.createLocalBackend(
        {
          path: '/local-backend',
        },
        requestOpts,
      );
    });

    it.sequential('configures Immich backup', async () => {
      const event = waitForMessage('IntegrationUpdate');

      await sdk.configureImmichIntegration(
        {
          name: 'Immich',
          worm: false,
          cron: '0 3 * * *',
          backupConfiguration: true,
          dataFolders: [StorageFolder.Backups, StorageFolder.Upload],
          libraries: 'all',
        },
        requestOpts,
      );

      await event;

      await expect(sdk.getIntegrations(requestOpts)).resolves.toEqual(
        expect.objectContaining({
          immichIntegration: expect.objectContaining({
            configuration: {
              backupConfiguration: true,
              dataFolders: ['backups', 'upload'],
              libraries: 'all',
            },
          }),
          immichState: {
            dataFolders: expect.arrayContaining(Object.values(StorageFolder)),
            dataPath: '/data',
            libraries: [],
          },
        }),
      );
    });

    it.sequential('updates configuration', async () => {
      await utils.mkFolder('/test');

      ({ id: libraryId } = await utils.createLibrary(admin.accessToken, {
        ownerId: admin.userId,
        name: 'My Library',
        importPaths: ['/test'],
      }));

      await expect(sdk.getIntegrations(requestOpts)).resolves.toEqual(
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

    it.sequential('creates a snapshot', async () => {
      const event = waitForMessage('TaskEnd');

      const {
        repositories: [{ id }],
      } = await sdk.getRepositories(requestOpts);

      filename = await utils.createBackup(admin.accessToken);

      await sdk.createBackup(id, requestOpts);
      await event;

      const {
        snapshots: [{ id: snapshotId }],
      } = await sdk.getSnapshots(id, requestOpts);

      await expect(sdk.getSnapshotListing(id, snapshotId, {}, requestOpts)).resolves.toMatchInlineSnapshot(`
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
            {
              "isDirectory": true,
              "path": "/yucca",
            },
          ],
          "parent": "/",
          "path": "/",
        }
      `);

      await expect(sdk.getSnapshotListing(id, snapshotId, { path: '/data' }, requestOpts)).resolves
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

      await expect(sdk.getSnapshotListing(id, snapshotId, { path: '/data/backups' }, requestOpts)).resolves.toEqual(
        expect.objectContaining({
          items: [
            {
              isDirectory: false,
              path: '/data/backups/.immich',
            },
            {
              isDirectory: false,
              path: expect.stringContaining('/data/backups/immich-db-backup-'),
            },
          ],
          parent: '/data',
          path: '/data/backups',
        }),
      );
    });
  });

  describe.sequential('Restore Local Backup', async () => {
    let cookie: string;

    beforeAll(async () => {
      await sdk.resetOrchestrator(requestOpts);
      await utils.resetDatabase();
      socket.disconnect();
      await utils.disconnectDatabase();
    });

    afterAll(async () => {
      await utils.connectDatabase();
    });

    it.sequential(
      'restores backup',
      async () => {
        const { status, headers } = await request(app).post('/admin/database-backups/start-restore').send();
        expect(status).toBe(201);
        cookie = headers['set-cookie'][0].split(';')[0];

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

        await expect(sdk.getSchedules(maintenanceRequestOpts)).resolves.toEqual({ schedules: [] });

        await sdk.importRecoveryKey(
          {
            recoveryKey: '0'.repeat(64),
          },
          maintenanceRequestOpts,
        );

        const {
          backend: { id: backendId },
        } = await sdk.createLocalBackend(
          {
            path: '/local-backend',
          },
          maintenanceRequestOpts,
        );

        const {
          repositories: [
            {
              id: repositoryId,
              snapshots: [{ id: snapshotId }],
            },
          ],
        } = await sdk.inspectRepositories({}, maintenanceRequestOpts);

        socket = io(baseUrl, {
          path: '/api/yucca/socket.io',
          transports: ['websocket'],
          extraHeaders: {
            cookie,
          },
        });

        const event = waitForMessage('TaskEnd');
        await sdk.restoreFromPoint(
          repositoryId,
          snapshotId,
          backendId,
          {
            yuccaConfig: '/yucca',
            include: ['/data'],
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

        await expect(sdk.getSchedules(requestOpts)).resolves.toEqual({
          schedules: expect.arrayContaining([expect.objectContaining({ id: expect.any(String) })]),
        });
      },
      60_000,
    );
  });
});
