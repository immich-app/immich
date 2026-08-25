import { LoginResponseDto, Permission, StorageTargetKind, StorageTransferScopeType } from '@immich/sdk';
import { readFileSync } from 'node:fs';
import { testAssetDir, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

const app = 'http://127.0.0.1:2285/api';

// Matches the minio service in e2e/docker-compose.yml. The server reaches it by
// service name; the bucket is created by the minio init container before the
// server starts.
const s3Config = {
  endpoint: 'http://minio-server:9000',
  bucket: 'immich',
  region: 'us-east-1',
  forcePathStyle: true,
  baseUrl: '',
  basePath: '',
  prefix: '',
};

const s3Secret = { accessKeyId: 'immich', secretAccessKey: 'immich-secret' };

describe('/admin/storage-targets', () => {
  let admin: LoginResponseDto;
  let user: LoginResponseDto;

  const createTarget = async (name: string, overrides: Record<string, unknown> = {}) => {
    const { status, body } = await request(app)
      .post('/admin/storage-targets')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        name,
        kind: StorageTargetKind.S3,
        config: { ...s3Config, prefix: name },
        secret: s3Secret,
        ...overrides,
      });

    expect(status).toBe(201);
    return body;
  };

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    user = await utils.userSetup(admin.accessToken, {
      email: 'storage-target@immich.cloud',
      password: 'password',
      name: 'Storage Target User',
    });
  });

  describe('POST /admin/storage-targets', () => {
    it('should require authentication', async () => {
      const { status } = await request(app).post('/admin/storage-targets').send({});
      expect(status).toBe(401);
    });

    it('should require admin', async () => {
      const { status } = await request(app)
        .post('/admin/storage-targets')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ name: 'nope', kind: StorageTargetKind.S3, config: s3Config, secret: s3Secret });

      expect(status).toBe(403);
    });

    it('should reject an S3 target without a bucket', async () => {
      const { status } = await request(app)
        .post('/admin/storage-targets')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          name: 'no-bucket',
          kind: StorageTargetKind.S3,
          config: { ...s3Config, bucket: '' },
          secret: s3Secret,
        });

      expect(status).toBe(400);
    });

    it('should never return the stored credentials', async () => {
      const target = await createTarget('secrets-are-private');

      expect(target).not.toHaveProperty('secret');
      expect(target.hasCredentials).toBe(true);

      const { body } = await request(app)
        .get('/admin/storage-targets')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      for (const item of body) {
        expect(item).not.toHaveProperty('secret');
      }
    });

    it('should reject a duplicate name', async () => {
      await createTarget('duplicate-name');

      const { status } = await request(app)
        .post('/admin/storage-targets')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'duplicate-name', kind: StorageTargetKind.S3, config: s3Config, secret: s3Secret });

      expect(status).toBe(400);
    });
  });

  describe('POST /admin/storage-targets/:id/test', () => {
    it('should connect to a correctly configured target', async () => {
      const target = await createTarget('connection-ok');

      const { status, body } = await request(app)
        .post(`/admin/storage-targets/${target.id}/test`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual({ ok: true });
    });

    it('should report bad credentials without failing the request', async () => {
      const target = await createTarget('connection-bad', {
        secret: { accessKeyId: 'wrong', secretAccessKey: 'alsowrong' },
      });

      const { status, body } = await request(app)
        .post(`/admin/storage-targets/${target.id}/test`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body.ok).toBe(false);
      expect(body.error).toBeTruthy();
    });
  });

  describe('PUT /admin/storage-targets/:id', () => {
    it('should keep the stored credentials when none are supplied', async () => {
      const target = await createTarget('keep-credentials');

      const { status, body } = await request(app)
        .put(`/admin/storage-targets/${target.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'keep-credentials-renamed' });

      expect(status).toBe(200);
      expect(body.name).toBe('keep-credentials-renamed');
      expect(body.hasCredentials).toBe(true);

      // Still usable, which is the real proof the credentials survived.
      const { body: result } = await request(app)
        .post(`/admin/storage-targets/${target.id}/test`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(result).toEqual({ ok: true });
    });
  });

  describe('export and import', () => {
    it('should export an asset and import it back for another user', async () => {
      const target = await createTarget('round-trip');

      const asset = await utils.createAsset(user.accessToken, {
        assetData: {
          filename: 'round-trip.jpg',
          bytes: readFileSync(`${testAssetDir}/albums/nature/tanners_ridge.jpg`),
        },
      });

      const { status: exportStatus, body: exportBody } = await request(app)
        .post(`/admin/storage-targets/${target.id}/export`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ ownerId: user.userId, scope: { type: StorageTransferScopeType.All } });

      expect(exportStatus).toBe(201);
      expect(exportBody.direction).toBe('export');

      await utils.waitForQueueFinish(admin.accessToken, 'storageTarget', 60_000);

      const { body: afterExport } = await request(app)
        .get(`/admin/storage-targets/${target.id}/transfers`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      const exported = afterExport.find((item: { id: string }) => item.id === exportBody.id);
      expect(exported.status).toBe('completed');
      expect(exported.completedCount).toBe(1);
      expect(exported.failedCount).toBe(0);

      // Import the same objects as the admin: a different owner, so the content
      // hash does not match anything they already have.
      const { status: importStatus, body: importBody } = await request(app)
        .post(`/admin/storage-targets/${target.id}/import`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ ownerId: admin.userId, scope: { type: StorageTransferScopeType.All } });

      expect(importStatus).toBe(201);

      await utils.waitForQueueFinish(admin.accessToken, 'storageTarget', 60_000);

      const { body: afterImport } = await request(app)
        .get(`/admin/storage-targets/${target.id}/transfers`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      const imported = afterImport.find((item: { id: string }) => item.id === importBody.id);
      expect(imported.status).toBe('completed');
      expect(imported.completedCount).toBe(1);

      // The imported asset belongs to the admin, and is a different row from the
      // one the other user uploaded.
      const { assets } = await utils.searchAssets(admin.accessToken, { originalFileName: 'round-trip.jpg' });
      const importedAsset = assets.items.find((item: { ownerId: string }) => item.ownerId === admin.userId);
      expect(importedAsset).toBeDefined();
      expect(importedAsset!.id).not.toBe(asset.id);
    }, 120_000);

    it('should skip assets that are already on the target', async () => {
      const target = await createTarget('idempotent-export');

      await request(app)
        .post(`/admin/storage-targets/${target.id}/export`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ ownerId: user.userId, scope: { type: StorageTransferScopeType.All } });

      await utils.waitForQueueFinish(admin.accessToken, 'storageTarget', 60_000);

      const { body: second } = await request(app)
        .post(`/admin/storage-targets/${target.id}/export`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ ownerId: user.userId, scope: { type: StorageTransferScopeType.All } });

      await utils.waitForQueueFinish(admin.accessToken, 'storageTarget', 60_000);

      const { body: transfers } = await request(app)
        .get(`/admin/storage-targets/${target.id}/transfers`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      // The re-run still counts the assets as completed, it just does no uploads.
      const rerun = transfers.find((item: { id: string }) => item.id === second.id);
      expect(rerun.status).toBe('completed');
      expect(rerun.failedCount).toBe(0);
    }, 120_000);
  });

  describe('DELETE /admin/storage-targets/:id', () => {
    it('should delete a target', async () => {
      const target = await createTarget('to-delete');

      const { status } = await request(app)
        .delete(`/admin/storage-targets/${target.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(204);

      const { status: getStatus } = await request(app)
        .get(`/admin/storage-targets/${target.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(getStatus).toBe(404);
    });
  });

  describe('permissions', () => {
    it('should allow an api key with adminStorageTarget.read', async () => {
      const { secret } = await utils.createApiKey(admin.accessToken, [Permission.AdminStorageTargetRead]);

      const { status } = await request(app).get('/admin/storage-targets').set('x-api-key', secret);
      expect(status).toBe(200);
    });

    it('should reject an api key without the permission', async () => {
      const { secret } = await utils.createApiKey(admin.accessToken, [Permission.AssetRead]);

      const { status } = await request(app).get('/admin/storage-targets').set('x-api-key', secret);
      expect(status).toBe(403);
    });
  });
});
