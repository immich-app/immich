import { LoginResponseDto, ManualJobName } from '@immich/sdk';
import { createUserDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, utils } from 'src/utils';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('/admin/maintenance', () => {
  let cookie: string | undefined;
  let admin: LoginResponseDto;
  let nonAdmin: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    nonAdmin = await utils.userSetup(admin.accessToken, createUserDto.user1);
    await utils.resetBackups(admin.accessToken);
  });

  // => outside of maintenance mode

  describe('GET ~/server/config', async () => {
    it('should indicate we are out of maintenance mode', async () => {
      const { status, body } = await request(app).get('/server/config');
      expect(status).toBe(200);
      expect(body.maintenanceMode).toBeFalsy();
    });
  });

  describe('GET /status', async () => {
    it('to always indicate we are not in maintenance mode', async () => {
      const { status, body } = await request(app).get('/admin/maintenance/status').send({ token: 'token' });
      expect(status).toBe(200);
      expect(body).toEqual({
        action: 'end',
      });
    });
  });

  describe('POST /login', async () => {
    it('should not work out of maintenance mode', async () => {
      const { status, body } = await request(app).post('/admin/maintenance/login').send({ token: 'token' });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Not in maintenance mode'));
    });
  });

  describe('GET /backups/list', async () => {
    it('should succeed and be empty', async () => {
      const { status, body } = await request(app)
        .get('/admin/maintenance/backups/list')
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

      await expect
        .poll(
          async () => {
            const { status, body } = await request(app)
              .get('/admin/maintenance/backups/list')
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
            backups: [expect.stringMatching(/immich-db-backup-\d{8}T\d{6}-v.*-pg.*\.sql\.gz$/)],
          }),
        );
    });
  });

  describe('DELETE /backups/:filename', async () => {
    it('should delete backup', async () => {
      const filename = await utils.createBackup(admin.accessToken);

      const { status } = await request(app)
        .delete(`/admin/maintenance/backups/${filename}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);

      const { status: listStatus, body } = await request(app)
        .get('/admin/maintenance/backups/list')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(listStatus).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          backups: [],
        }),
      );
    });
  });

  // => enter maintenance mode

  describe.sequential('POST /', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post('/admin/maintenance').send({
        action: 'end',
      });
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should only work for admins', async () => {
      const { status, body } = await request(app)
        .post('/admin/maintenance')
        .set('Authorization', `Bearer ${nonAdmin.accessToken}`)
        .send({ action: 'end' });
      expect(status).toBe(403);
      expect(body).toEqual(errorDto.forbidden);
    });

    it('should be a no-op if try to exit maintenance mode', async () => {
      const { status } = await request(app)
        .post('/admin/maintenance')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ action: 'end' });
      expect(status).toBe(201);
    });

    it('should enter maintenance mode', async () => {
      const { status, headers } = await request(app)
        .post('/admin/maintenance')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          action: 'start',
        });

      expect(status).toBe(201);

      cookie = headers['set-cookie'][0].split(';')[0];
      expect(cookie).toEqual(
        expect.stringMatching(/^immich_maintenance_token=[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*$/),
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
            timeout: 10_000,
          },
        )
        .toBeTruthy();
    });
  });

  // => in maintenance mode

  describe.sequential('in maintenance mode', () => {
    describe('GET ~/server/config', async () => {
      it('should indicate we are in maintenance mode', async () => {
        const { status, body } = await request(app).get('/server/config');
        expect(status).toBe(200);
        expect(body.maintenanceMode).toBeTruthy();
      });
    });

    describe('GET /status', async () => {
      it('to indicate we are in maintenance mode', async () => {
        const { status, body } = await request(app).get('/admin/maintenance/status').send({ token: 'token' });
        expect(status).toBe(200);
        expect(body).toEqual({
          action: 'start',
        });
      });
    });

    describe('POST /login', async () => {
      it('should fail without cookie or token in body', async () => {
        const { status, body } = await request(app).post('/admin/maintenance/login').send({});
        expect(status).toBe(401);
        expect(body).toEqual(errorDto.unauthorizedWithMessage('Missing JWT Token'));
      });

      it('should succeed with cookie', async () => {
        const { status, body } = await request(app).post('/admin/maintenance/login').set('cookie', cookie!).send({});
        expect(status).toBe(201);
        expect(body).toEqual(
          expect.objectContaining({
            username: 'Immich Admin',
          }),
        );
      });

      it('should succeed with token', async () => {
        const { status, body } = await request(app)
          .post('/admin/maintenance/login')
          .send({
            token: cookie!.split('=')[1].trim(),
          });
        expect(status).toBe(201);
        expect(body).toEqual(
          expect.objectContaining({
            username: 'Immich Admin',
          }),
        );
      });
    });

    describe('POST /', async () => {
      it('should be a no-op if try to enter maintenance mode', async () => {
        const { status } = await request(app)
          .post('/admin/maintenance')
          .set('cookie', cookie!)
          .send({ action: 'start' });
        expect(status).toBe(201);
      });
    });
  });

  // => exit maintenance mode

  describe.sequential('POST /', () => {
    it('should exit maintenance mode', async () => {
      const { status } = await request(app).post('/admin/maintenance').set('cookie', cookie!).send({
        action: 'end',
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
        .toBeFalsy();
    });
  });

  // => action: restore database flow

  describe.sequential('POST /backups/restore', () => {
    afterAll(async () => {
      await request(app).post('/admin/maintenance').set('cookie', cookie!).send({ action: 'end' });
      await utils.poll(
        () => request(app).get('/server/config'),
        ({ status, body }) => status === 200 && !body.maintenanceMode,
      );

      admin = await utils.adminSetup();
      nonAdmin = await utils.userSetup(admin.accessToken, createUserDto.user1);
    });

    it.sequential('should not work when the server is configured', async () => {
      const { status, body } = await request(app).post('/admin/maintenance/backups/restore').send();

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('The server already has an admin'));
    });

    it.sequential('should enter maintenance mode in "database restore mode"', async () => {
      await utils.resetDatabase(); // reset database before running this test

      const { status, headers } = await request(app).post('/admin/maintenance/backups/restore').send();

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
        action: 'restore_database',
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
      const filename = await utils.createBackup(admin.accessToken);

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
            timeout: 6000,
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
  });
});
