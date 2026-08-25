import { LoginResponseDto, Permission, StorageTargetKind, StorageTransferScopeType } from '@immich/sdk';
import { randomBytes } from 'node:crypto';
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

// The bucket outlives the database, so objects written by an earlier run would
// otherwise look like files Immich has never seen. Namespacing every target by
// run keeps each one looking at only what it just wrote.
const runId = randomBytes(6).toString('hex');

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
        config: { ...s3Config, prefix: `${runId}/${name}` },
        secret: s3Secret,
        ...overrides,
      });

    expect(status).toBe(201);
    return body;
  };

  const startTransfer = async (targetId: string, direction: 'export' | 'import', ownerId: string) => {
    const { status, body } = await request(app)
      .post(`/admin/storage-targets/${targetId}/${direction}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ ownerId, scope: { type: StorageTransferScopeType.All } });

    expect(status).toBe(201);
    await utils.waitForQueueFinish(admin.accessToken, 'storageTarget', 60_000);

    const { body: transfers } = await request(app)
      .get(`/admin/storage-targets/${targetId}/transfers`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    return transfers.find((item: { id: string }) => item.id === body.id);
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
    it("should export a user's originals to the target", async () => {
      const target = await createTarget('export-originals');

      await utils.createAsset(user.accessToken, {
        assetData: {
          filename: 'exported.jpg',
          bytes: readFileSync(`${testAssetDir}/albums/nature/tanners_ridge.jpg`),
        },
      });

      const transfer = await startTransfer(target.id, 'export', user.userId);

      expect(transfer.status).toBe('completed');
      expect(transfer.completedCount).toBeGreaterThanOrEqual(1);
      expect(transfer.failedCount).toBe(0);
    }, 120_000);

    it('should not re-import what it exported to the same target', async () => {
      const target = await createTarget('no-round-trip');

      await utils.createAsset(user.accessToken, {
        assetData: {
          filename: 'no-round-trip.jpg',
          bytes: readFileSync(`${testAssetDir}/albums/nature/silver_fir.jpg`),
        },
      });

      const exported = await startTransfer(target.id, 'export', user.userId);
      expect(exported.completedCount).toBeGreaterThanOrEqual(1);

      // The ledger records every object this instance has put on the target, so
      // importing from a target you export to is a deliberate no-op. Without it,
      // a backup target would feed a user's own library back in as duplicates
      // every time an import ran.
      const imported = await startTransfer(target.id, 'import', admin.userId);

      expect(imported.status).toBe('completed');
      expect(imported.totalCount).toBe(0);
    }, 120_000);

    it('should import objects it has never seen before', async () => {
      const source = await createTarget('shared-bucket-source');

      await utils.createAsset(user.accessToken, {
        assetData: {
          filename: 'shared-bucket.jpg',
          bytes: readFileSync(`${testAssetDir}/albums/nature/el_torcal_rocks.jpg`),
        },
      });

      await startTransfer(source.id, 'export', user.userId);

      // A second target over the same objects has its own empty ledger, which is
      // the same position Immich is in when handed a bucket it did not fill.
      const destination = await createTarget('shared-bucket-destination', {
        config: { ...s3Config, prefix: `${runId}/shared-bucket-source` },
      });

      const imported = await startTransfer(destination.id, 'import', admin.userId);

      expect(imported.status).toBe('completed');
      expect(imported.completedCount).toBeGreaterThanOrEqual(1);
      expect(imported.failedCount).toBe(0);

      // The bytes really became an asset owned by the importing user.
      const { assets } = await utils.searchAssets(admin.accessToken, {});
      expect(assets.items.some((item: { ownerId: string }) => item.ownerId === admin.userId)).toBe(true);
    }, 120_000);

    it('should skip assets that are already on the target', async () => {
      const target = await createTarget('idempotent-export');

      await utils.createAsset(user.accessToken, {
        assetData: {
          filename: 'idempotent.jpg',
          bytes: readFileSync(`${testAssetDir}/albums/nature/notocactus_minimus.jpg`),
        },
      });

      await startTransfer(target.id, 'export', user.userId);
      const rerun = await startTransfer(target.id, 'export', user.userId);

      // The re-run still counts the assets as completed, it just does no uploads.
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
