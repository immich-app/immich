import { IntegrityReportType, LoginResponseDto, ManualJobName, QueueName } from '@immich/sdk';
import { readFile } from 'node:fs/promises';
import { app, testAssetDir, utils } from 'src/utils';
import request from 'supertest';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

const assetFilepath = `${testAssetDir}/metadata/gps-position/thompson-springs.jpg`;

describe('/admin/integrity', () => {
  let admin: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  describe('POST /summary (& jobs)', async () => {
    let baseline: Record<IntegrityReportType, number>;

    beforeAll(async () => {
      await utils.createAsset(admin.accessToken, {
        assetData: {
          filename: 'asset.jpg',
          bytes: await readFile(assetFilepath),
        },
      });

      await utils.copyFolder(`/data/upload/${admin.userId}`, `/data/upload/${admin.userId}-bak`);
    });

    afterEach(async () => {
      await utils.deleteFolder(`/data/upload/${admin.userId}`);
      await utils.copyFolder(`/data/upload/${admin.userId}-bak`, `/data/upload/${admin.userId}`);
    });

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

      await utils.waitForQueueFinish(admin.accessToken, QueueName.IntegrityCheck);

      const { status, body } = await request(app)
        .get('/admin/integrity/summary')
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
      await utils.putTextFile('orphan', `/data/upload/${admin.userId}/orphan1.png`);

      await utils.createJob(admin.accessToken, {
        name: ManualJobName.IntegrityOrphanFiles,
      });

      await utils.waitForQueueFinish(admin.accessToken, QueueName.IntegrityCheck);

      const { status, body } = await request(app)
        .get('/admin/integrity/summary')
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
      // these should not be detected:
      await utils.putTextFile('orphan', `/data/upload/${admin.userId}/orphan2.png`);
      await utils.putTextFile('orphan', `/data/upload/${admin.userId}/orphan3.png`);

      await utils.createJob(admin.accessToken, {
        name: ManualJobName.IntegrityOrphanFilesRefresh,
      });

      await utils.waitForQueueFinish(admin.accessToken, QueueName.IntegrityCheck);

      const { status, body } = await request(app)
        .get('/admin/integrity/summary')
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
      await utils.deleteFolder(`/data/upload/${admin.userId}`);

      await utils.createJob(admin.accessToken, {
        name: ManualJobName.IntegrityMissingFiles,
      });

      await utils.waitForQueueFinish(admin.accessToken, QueueName.IntegrityCheck);

      const { status, body } = await request(app)
        .get('/admin/integrity/summary')
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

    it.sequential('should detect outdated missing file reports (job: refresh missing files)', async () => {
      await utils.createJob(admin.accessToken, {
        name: ManualJobName.IntegrityMissingFilesRefresh,
      });

      await utils.waitForQueueFinish(admin.accessToken, QueueName.IntegrityCheck);

      const { status, body } = await request(app)
        .get('/admin/integrity/summary')
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

    it.sequential('should detect a checksum mismatch (job: check file checksums)', async () => {
      await utils.truncateFolder(`/data/upload/${admin.userId}`);

      await utils.createJob(admin.accessToken, {
        name: ManualJobName.IntegrityChecksumMismatch,
      });

      await utils.waitForQueueFinish(admin.accessToken, QueueName.IntegrityCheck);

      const { status, body } = await request(app)
        .get('/admin/integrity/summary')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send();

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          checksum_mismatch: 1,
        }),
      );
    });

    it.sequential('should detect outdated checksum mismatch reports (job: refresh file checksums)', async () => {
      await utils.createJob(admin.accessToken, {
        name: ManualJobName.IntegrityChecksumMismatchRefresh,
      });

      await utils.waitForQueueFinish(admin.accessToken, QueueName.IntegrityCheck);

      const { status, body } = await request(app)
        .get('/admin/integrity/summary')
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
});
