import {
  AssetMediaResponseDto,
  IntegrityReportResponseDto,
  IntegrityReportType,
  LoginResponseDto,
  ManualJobName,
  QueueName,
} from '@immich/sdk';
import { readFile } from 'node:fs/promises';
import { app, testAssetDir, utils } from 'src/utils';
import request from 'supertest';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

const assetFilepath = `${testAssetDir}/metadata/gps-position/thompson-springs.jpg`;

describe('/admin/integrity', () => {
  let admin: LoginResponseDto;
  let asset: AssetMediaResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  beforeAll(async () => {
    asset = await utils.createAsset(admin.accessToken, {
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

  describe('POST /summary (& jobs)', async () => {
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

  describe('POST /report', async () => {
    it.sequential('reports orphan files', async () => {
      await utils.putTextFile('orphan', `/data/upload/${admin.userId}/orphan1.png`);

      await utils.createJob(admin.accessToken, {
        name: ManualJobName.IntegrityOrphanFiles,
      });

      await utils.waitForQueueFinish(admin.accessToken, QueueName.IntegrityCheck);

      const { status, body } = await request(app)
        .post('/admin/integrity/report')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ type: 'orphan_file' });

      expect(status).toBe(200);
      expect(body).toEqual({
        hasNextPage: expect.any(Boolean),
        items: expect.arrayContaining([
          {
            id: expect.any(String),
            type: 'orphan_file',
            path: `/data/upload/${admin.userId}/orphan1.png`,
            assetId: null,
            fileAssetId: null,
          },
        ]),
      });
    });

    it.sequential('reports missing files', async () => {
      await utils.deleteFolder(`/data/upload/${admin.userId}`);

      await utils.createJob(admin.accessToken, {
        name: ManualJobName.IntegrityMissingFiles,
      });

      await utils.waitForQueueFinish(admin.accessToken, QueueName.IntegrityCheck);

      const { status, body } = await request(app)
        .post('/admin/integrity/report')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ type: 'missing_file' });

      expect(status).toBe(200);
      expect(body).toEqual({
        hasNextPage: expect.any(Boolean),
        items: expect.arrayContaining([
          {
            id: expect.any(String),
            type: 'missing_file',
            path: expect.any(String),
            assetId: asset.id,
            fileAssetId: null,
          },
        ]),
      });
    });

    it.sequential('reports checksum mismatched files', async () => {
      await utils.truncateFolder(`/data/upload/${admin.userId}`);

      await utils.createJob(admin.accessToken, {
        name: ManualJobName.IntegrityChecksumMismatch,
      });

      await utils.waitForQueueFinish(admin.accessToken, QueueName.IntegrityCheck);

      const { status, body } = await request(app)
        .post('/admin/integrity/report')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ type: 'checksum_mismatch' });

      expect(status).toBe(200);
      expect(body).toEqual({
        hasNextPage: expect.any(Boolean),
        items: expect.arrayContaining([
          {
            id: expect.any(String),
            type: 'checksum_mismatch',
            path: expect.any(String),
            assetId: asset.id,
            fileAssetId: null,
          },
        ]),
      });
    });
  });

  describe('DELETE /report/:id', async () => {
    it.sequential('delete orphan files', async () => {
      await utils.putTextFile('orphan', `/data/upload/${admin.userId}/orphan1.png`);

      await utils.createJob(admin.accessToken, {
        name: ManualJobName.IntegrityOrphanFiles,
      });

      await utils.waitForQueueFinish(admin.accessToken, QueueName.IntegrityCheck);

      const { status: listStatus, body: listBody } = await request(app)
        .post('/admin/integrity/report')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ type: 'orphan_file' });

      expect(listStatus).toBe(200);

      const report = (listBody as IntegrityReportResponseDto).items.find(
        (item) => item.path === `/data/upload/${admin.userId}/orphan1.png`,
      )!;

      const { status } = await request(app)
        .delete(`/admin/integrity/report/${report.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send();

      expect(status).toBe(200);

      await utils.createJob(admin.accessToken, {
        name: ManualJobName.IntegrityOrphanFiles,
      });

      await utils.waitForQueueFinish(admin.accessToken, QueueName.IntegrityCheck);

      const { status: listStatus2, body: listBody2 } = await request(app)
        .post('/admin/integrity/report')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ type: 'orphan_file' });

      expect(listStatus2).toBe(200);
      expect(listBody2).not.toBe(
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              id: report.id,
            }),
          ]),
        }),
      );
    });

    it.sequential('delete assets missing files', async () => {
      await utils.deleteFolder(`/data/upload/${admin.userId}`);

      await utils.createJob(admin.accessToken, {
        name: ManualJobName.IntegrityMissingFiles,
      });

      await utils.waitForQueueFinish(admin.accessToken, QueueName.IntegrityCheck);

      const { status: listStatus, body: listBody } = await request(app)
        .post('/admin/integrity/report')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ type: 'missing_file' });

      expect(listStatus).toBe(200);
      expect(listBody.items.length).toBe(1);

      const report = (listBody as IntegrityReportResponseDto).items[0];

      const { status } = await request(app)
        .delete(`/admin/integrity/report/${report.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send();

      expect(status).toBe(200);

      await utils.createJob(admin.accessToken, {
        name: ManualJobName.IntegrityMissingFiles,
      });

      await utils.waitForQueueFinish(admin.accessToken, QueueName.IntegrityCheck);

      const { status: listStatus2, body: listBody2 } = await request(app)
        .post('/admin/integrity/report')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ type: 'missing_file' });

      expect(listStatus2).toBe(200);
      expect(listBody2.items.length).toBe(0);
    });

    it.sequential('delete assets with failing checksum', async () => {
      await utils.truncateFolder(`/data/upload/${admin.userId}`);

      await utils.createJob(admin.accessToken, {
        name: ManualJobName.IntegrityChecksumMismatch,
      });

      await utils.waitForQueueFinish(admin.accessToken, QueueName.IntegrityCheck);

      const { status: listStatus, body: listBody } = await request(app)
        .post('/admin/integrity/report')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ type: 'checksum_mismatch' });

      expect(listStatus).toBe(200);
      expect(listBody.items.length).toBe(1);

      const report = (listBody as IntegrityReportResponseDto).items[0];

      const { status } = await request(app)
        .delete(`/admin/integrity/report/${report.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send();

      expect(status).toBe(200);

      await utils.createJob(admin.accessToken, {
        name: ManualJobName.IntegrityChecksumMismatch,
      });

      await utils.waitForQueueFinish(admin.accessToken, QueueName.IntegrityCheck);

      const { status: listStatus2, body: listBody2 } = await request(app)
        .post('/admin/integrity/report')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ type: 'checksum_mismatch' });

      expect(listStatus2).toBe(200);
      expect(listBody2.items.length).toBe(0);
    });
  });

  describe('GET /report/:type/csv', () => {
    it.sequential('exports orphan files as csv', async () => {
      await utils.putTextFile('orphan', `/data/upload/${admin.userId}/orphan1.png`);

      await utils.createJob(admin.accessToken, {
        name: ManualJobName.IntegrityOrphanFiles,
      });

      await utils.waitForQueueFinish(admin.accessToken, QueueName.IntegrityCheck);

      const { status, headers, text } = await request(app)
        .get('/admin/integrity/report/orphan_file/csv')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send();

      expect(status).toBe(200);
      expect(headers['content-type']).toContain('text/csv');
      expect(headers['content-disposition']).toContain('.csv');
      expect(text).toContain('id,type,assetId,fileAssetId,path');
      expect(text).toContain(`orphan_file`);
      expect(text).toContain(`/data/upload/${admin.userId}/orphan1.png`);
    });
  });

  describe('GET /report/:id/file', () => {
    it.sequential('downloads orphan file', async () => {
      await utils.putTextFile('orphan-content', `/data/upload/${admin.userId}/orphan1.png`);

      await utils.createJob(admin.accessToken, {
        name: ManualJobName.IntegrityOrphanFiles,
      });

      await utils.waitForQueueFinish(admin.accessToken, QueueName.IntegrityCheck);

      const { body: listBody } = await request(app)
        .post('/admin/integrity/report')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ type: 'orphan_file' });

      const report = (listBody as IntegrityReportResponseDto).items.find(
        (item) => item.path === `/data/upload/${admin.userId}/orphan1.png`,
      )!;

      const { status, headers, body } = await request(app)
        .get(`/admin/integrity/report/${report.id}/file`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .buffer(true)
        .send();

      expect(status).toBe(200);
      expect(headers['content-type']).toContain('application/octet-stream');
      expect(body.toString()).toBe('orphan-content');
    });
  });
});
