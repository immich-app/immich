import { IntegrityReportType, LoginResponseDto, ManualJobName, QueueName } from '@immich/sdk';
import { readFile } from 'node:fs/promises';
import { createUserDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, testAssetDir, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

const locationAssetFilepath = `${testAssetDir}/metadata/gps-position/thompson-springs.jpg`;
const ratingAssetFilepath = `${testAssetDir}/metadata/rating/mongolels.jpg`;

describe('/admin/maintenance', () => {
  let cookie: string | undefined;
  let admin: LoginResponseDto;
  let nonAdmin: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    nonAdmin = await utils.userSetup(admin.accessToken, createUserDto.user1);
  });

  // => outside of maintenance mode

  describe('GET ~/server/config', async () => {
    it('should indicate we are out of maintenance mode', async () => {
      const { status, body } = await request(app).get('/server/config');
      expect(status).toBe(200);
      expect(body.maintenanceMode).toBeFalsy();
    });
  });

  describe('POST /login', async () => {
    it('should not work out of maintenance mode', async () => {
      const { status, body } = await request(app).post('/admin/maintenance/login').send({ token: 'token' });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest('Not in maintenance mode'));
    });
  });

  describe('POST /integrity/summary (& jobs)', async () => {
    let baseline: Record<IntegrityReportType, number>;

    it.sequential('may report issues', async () => {
      await utils.createJob(admin.accessToken, {
        name: ManualJobName.IntegrityOrphanFiles,
      });

      await utils.createJob(admin.accessToken, {
        name: ManualJobName.IntegrityMissingFiles,
      });

      await utils.createJob(admin.accessToken, {
        name: ManualJobName.IntegrityChecksumMismatch,
      });

      await utils.waitForQueueFinish(admin.accessToken, QueueName.BackgroundTask);

      const { status, body } = await request(app)
        .get('/admin/maintenance/integrity/summary')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send();

      expect(status).toBe(200);
      expect(body).toEqual({
        missing_file: 0,
        orphan_file: expect.any(Number),
        checksum_mismatch: 0,
      });

      baseline = body;
    });

    it.sequential('should detect an orphan file (job: check orphan files)', async () => {
      await utils.putTextFile('orphan', '/data/upload/orphan.png');

      await utils.createJob(admin.accessToken, {
        name: ManualJobName.IntegrityOrphanFiles,
      });

      await utils.waitForQueueFinish(admin.accessToken, QueueName.BackgroundTask);

      const { status, body } = await request(app)
        .get('/admin/maintenance/integrity/summary')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send();

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          orphan_file: baseline.orphan_file + 1,
        }),
      );
    });

    it.sequential('should detect outdated orphan file reports (job: refresh orphan files)', async () => {
      await utils.deleteFile('/data/upload/orphan.png');
      await utils.putTextFile('orphan', '/data/upload/orphan1.png');
      await utils.putTextFile('orphan', '/data/upload/orphan2.png');

      await utils.createJob(admin.accessToken, {
        name: ManualJobName.IntegrityOrphanFilesRefresh,
      });

      await utils.waitForQueueFinish(admin.accessToken, QueueName.BackgroundTask);

      const { status, body } = await request(app)
        .get('/admin/maintenance/integrity/summary')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send();

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          orphan_file: baseline.orphan_file,
        }),
      );
    });

    it.sequential('should detect a missing file and not a checksum mismatch (job: check missing files)', async () => {
      await utils.createAsset(admin.accessToken, {
        assetData: {
          filename: 'asset.jpg',
          bytes: await readFile(locationAssetFilepath),
        },
      });

      await utils.move(`/data/upload/${admin.userId}`, `/data/upload/${admin.userId}-tmp`);

      await utils.createJob(admin.accessToken, {
        name: ManualJobName.IntegrityMissingFiles,
      });

      await utils.waitForQueueFinish(admin.accessToken, QueueName.BackgroundTask);

      const { status, body } = await request(app)
        .get('/admin/maintenance/integrity/summary')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send();

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          missing_file: 1,
          checksum_mismatch: 0,
        }),
      );
    });

    it.sequential.skip('should detect outdated missing file reports (job: refresh missing files)', async () => {
      await utils.move(`/data/upload/${admin.userId}-tmp`, `/data/upload/${admin.userId}`);

      await utils.createJob(admin.accessToken, {
        name: ManualJobName.IntegrityMissingFilesRefresh,
      });

      await utils.waitForQueueFinish(admin.accessToken, QueueName.BackgroundTask);

      const { status, body } = await request(app)
        .get('/admin/maintenance/integrity/summary')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send();

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          missing_file: 0,
          checksum_mismatch: 0,
        }),
      );
    });

    it.sequential('should detect a checksum mismatch', async () => {
      await utils.createAsset(admin.accessToken, {
        assetData: {
          filename: 'asset.jpg',
          bytes: await readFile(ratingAssetFilepath),
        },
      });

      await utils.copyFolder(`/data/upload/${admin.userId}`, `/data/upload/${admin.userId}-tmp`);
      await utils.truncateFolder(`/data/upload/${admin.userId}`);

      await utils.createJob(admin.accessToken, {
        name: ManualJobName.IntegrityChecksumMismatch,
      });

      await utils.waitForQueueFinish(admin.accessToken, QueueName.BackgroundTask);

      const { status, body } = await request(app)
        .get('/admin/maintenance/integrity/summary')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send();

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          checksum_mismatch: 1,
        }),
      );
    });

    it.sequential('should detect outdated checksum mismatch reports', async () => {
      await utils.deleteFolder(`/data/upload/${admin.userId}`);
      await utils.move(`/data/upload/${admin.userId}-tmp`, `/data/upload/${admin.userId}`);

      await utils.createJob(admin.accessToken, {
        name: ManualJobName.IntegrityChecksumMismatchRefresh,
      });

      await utils.waitForQueueFinish(admin.accessToken, QueueName.BackgroundTask);

      const { status, body } = await request(app)
        .get('/admin/maintenance/integrity/summary')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send();

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          checksum_mismatch: 0,
        }),
      );
    });
  });

  // => enter maintenance mode

  describe.skip.sequential('POST /', () => {
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
            const { body } = await request(app).get('/server/config');
            return body.maintenanceMode;
          },
          {
            interval: 5e2,
            timeout: 1e4,
          },
        )
        .toBeTruthy();
    });
  });

  // => in maintenance mode

  describe.skip.sequential('in maintenance mode', () => {
    describe('GET ~/server/config', async () => {
      it('should indicate we are in maintenance mode', async () => {
        const { status, body } = await request(app).get('/server/config');
        expect(status).toBe(200);
        expect(body.maintenanceMode).toBeTruthy();
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

  describe.skip.sequential('POST /', () => {
    it('should exit maintenance mode', async () => {
      const { status } = await request(app).post('/admin/maintenance').set('cookie', cookie!).send({
        action: 'end',
      });

      expect(status).toBe(201);

      await expect
        .poll(
          async () => {
            const { body } = await request(app).get('/server/config');
            return body.maintenanceMode;
          },
          {
            interval: 5e2,
            timeout: 1e4,
          },
        )
        .toBeFalsy();
    });
  });
});
