import { LoginResponseDto, ManualJobName } from '@immich/sdk';
import { errorDto } from 'src/responses';
import { app, utils } from 'src/utils';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('/admin/database-backups', () => {
  let cookie: string | undefined;
  let admin: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    await utils.resetBackups(admin.accessToken);
  });

  describe('GET /', async () => {
    it('should succeed and be empty', async () => {
      const { status, body } = await request(app)
        .get('/admin/database-backups')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual({
        backups: [],
      });
    });

    it('should contain a created backup', async () => {
      await utils.createJob(admin.accessToken, {
        name: ManualJobName.BackupDatabase,
      });

      await utils.waitForQueueFinish(admin.accessToken, 'backupDatabase');

      await expect
        .poll(
          async () => {
            const { status, body } = await request(app)
              .get('/admin/database-backups')
              .set('Authorization', `Bearer ${admin.accessToken}`);

            expect(status).toBe(200);
            return body;
          },
          {
            interval: 500,
            timeout: 10_000,
          },
        )
        .toEqual(
          expect.objectContaining({
            backups: [
              expect.objectContaining({
                filename: expect.stringMatching(/immich-db-backup-\d{8}T\d{6}-v.*-pg.*\.sql\.gz$/),
                filesize: expect.any(Number),
              }),
            ],
          }),
        );
    });
  });

  describe('DELETE /', async () => {
    it('should delete backup', async () => {
      const filename = await utils.createBackup(admin.accessToken);

      const { status } = await request(app)
        .delete(`/admin/database-backups`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ backups: [filename] });

      expect(status).toBe(200);

      const { status: listStatus, body } = await request(app)
        .get('/admin/database-backups')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(listStatus).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          backups: [],
        }),
      );
    });
  });

  // => action: restore database flow

  describe.sequential('POST /start-restore', () => {
    afterAll(async () => {
      await request(app).post('/admin/maintenance').set('cookie', cookie!).send({ action: 'end' });
      await utils.poll(
        () => request(app).get('/server/config'),
        ({ status, body }) => status === 200 && !body.maintenanceMode,
      );

      admin = await utils.adminSetup();
    });

    it.sequential('should not work when the server is configured', async () => {
      const { status, body } = await request(app).post('/admin/database-backups/start-restore').send();

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('The server already has an admin'));
    });

    it.sequential('should enter maintenance mode in "database restore mode"', async () => {
      await utils.resetDatabase(); // reset database before running this test

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

      const { status: status2, body } = await request(app).get('/admin/maintenance/status').send({ token: 'token' });
      expect(status2).toBe(200);
      expect(body).toEqual({
        active: true,
        action: 'select_database_restore',
      });
    });
  });

  // => action: restore database

  describe.sequential('POST /backups/restore', () => {
    beforeAll(async () => {
      await utils.disconnectDatabase();
    });

    afterAll(async () => {
      await utils.connectDatabase();
    });

    it.sequential('should restore a backup', { timeout: 60_000 }, async () => {
      let filename = await utils.createBackup(admin.accessToken);

      // work-around until test is running on released version
      await utils.move(
        `/data/backups/${filename}`,
        '/data/backups/immich-db-backup-20260114T184016-v2.5.0-pg14.19.sql.gz',
      );
      filename = 'immich-db-backup-20260114T184016-v2.5.0-pg14.19.sql.gz';

      const { status } = await request(app)
        .post('/admin/maintenance')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          action: 'restore_database',
          restoreBackupFilename: filename,
        });

      expect(status).toBe(201);

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

      const { status: status2, body } = await request(app).get('/admin/maintenance/status').send({ token: 'token' });
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
    });

    it.sequential('fail to restore a corrupted backup', { timeout: 60_000 }, async () => {
      await utils.prepareTestBackup('corrupted');

      const { status, headers } = await request(app)
        .post('/admin/maintenance')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          action: 'restore_database',
          restoreBackupFilename: 'development-corrupted.sql.gz',
        });

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

      await expect
        .poll(
          async () => {
            const { status, body } = await request(app).get('/admin/maintenance/status').send({ token: 'token' });
            expect(status).toBe(200);
            return body;
          },
          {
            interval: 500,
            timeout: 10_000,
          },
        )
        .toEqual(
          expect.objectContaining({
            active: true,
            action: 'restore_database',
            error: 'Something went wrong, see logs!',
          }),
        );

      const { status: status2, body: body2 } = await request(app)
        .get('/admin/maintenance/status')
        .set('cookie', cookie!)
        .send({ token: 'token' });
      expect(status2).toBe(200);
      expect(body2).toEqual(
        expect.objectContaining({
          active: true,
          action: 'restore_database',
          error: expect.stringContaining('IM CORRUPTED'),
        }),
      );

      await request(app).post('/admin/maintenance').set('cookie', cookie!).send({
        action: 'end',
      });

      await utils.poll(
        () => request(app).get('/server/config'),
        ({ status, body }) => status === 200 && !body.maintenanceMode,
      );
    });

    it.sequential('rollback to restore point if backup is missing admin', { timeout: 60_000 }, async () => {
      await utils.prepareTestBackup('empty');

      const { status, headers } = await request(app)
        .post('/admin/maintenance')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          action: 'restore_database',
          restoreBackupFilename: 'development-empty.sql.gz',
        });

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

      await expect
        .poll(
          async () => {
            const { status, body } = await request(app).get('/admin/maintenance/status').send({ token: 'token' });
            expect(status).toBe(200);
            return body;
          },
          {
            interval: 500,
            timeout: 30_000,
          },
        )
        .toEqual(
          expect.objectContaining({
            active: true,
            action: 'restore_database',
            error: 'Something went wrong, see logs!',
          }),
        );

      const { status: status2, body: body2 } = await request(app)
        .get('/admin/maintenance/status')
        .set('cookie', cookie!)
        .send({ token: 'token' });
      expect(status2).toBe(200);
      expect(body2).toEqual(
        expect.objectContaining({
          active: true,
          action: 'restore_database',
          error: expect.stringContaining('Server health check failed, no admin exists.'),
        }),
      );

      await request(app).post('/admin/maintenance').set('cookie', cookie!).send({
        action: 'end',
      });

      await utils.poll(
        () => request(app).get('/server/config'),
        ({ status, body }) => status === 200 && !body.maintenanceMode,
      );
    });
  });
});
