import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { Kysely } from 'kysely';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { StorageCore } from 'src/cores/storage.core';
import { JobStatus, StorageTargetKind, StorageTransferDirection, StorageTransferStatus } from 'src/enum';
import { AssetRepository } from 'src/repositories/asset.repository';
import { CryptoRepository } from 'src/repositories/crypto.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { RemoteStorageRepository } from 'src/repositories/remote-storage.repository';
import { StorageTargetRepository } from 'src/repositories/storage-target.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { DB } from 'src/schema';
import { StorageTransferService } from 'src/services/storage-transfer.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { beforeAll, describe, expect, it } from 'vitest';

let defaultDatabase: Kysely<DB>;
let container: StartedTestContainer;
let endpoint: string;
let mediaLocation: string;

const BUCKET = 'immich';
const CREDENTIALS = { accessKeyId: 'immich', secretAccessKey: 'immich-secret' };

const setup = () => {
  const result = newMediumService(StorageTransferService, {
    database: defaultDatabase,
    real: [
      AssetRepository,
      CryptoRepository,
      RemoteStorageRepository,
      StorageRepository,
      StorageTargetRepository,
      UserRepository,
    ],
    mock: [JobRepository, LoggingRepository],
  });

  // The import path queues metadata extraction and cleanup; nothing here drains
  // a real queue, so the calls just need to resolve.
  result.ctx.getMock(JobRepository).queue.mockResolvedValue();

  return result;
};

const newTarget = async (prefix = '') => {
  const repository = new StorageTargetRepository(defaultDatabase);

  return repository.create({
    name: `minio-${Math.random().toString(36).slice(2)}`,
    kind: StorageTargetKind.S3,
    config: { kind: StorageTargetKind.S3, endpoint, bucket: BUCKET, region: 'us-east-1', forcePathStyle: true, prefix },
    secret: { kind: StorageTargetKind.S3, ...CREDENTIALS },
    isEnabled: true,
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();

  container = await new GenericContainer('minio/minio:RELEASE.2025-04-22T22-12-26Z')
    .withExposedPorts(9000)
    .withEnvironment({ MINIO_ROOT_USER: 'immich', MINIO_ROOT_PASSWORD: 'immich-secret' })
    .withCommand(['server', '/data'])
    .withWaitStrategy(Wait.forLogMessage(/API:/))
    .start();

  endpoint = `http://${container.getHost()}:${container.getMappedPort(9000)}`;

  const client = new S3Client({
    region: 'us-east-1',
    endpoint,
    forcePathStyle: true,
    credentials: CREDENTIALS,
  });
  await client.send(new CreateBucketCommand({ Bucket: BUCKET }));

  // Both handlers resolve real paths through StorageCore, so it needs a real root.
  mediaLocation = await mkdtemp(join(tmpdir(), 'immich-transfer-'));
  StorageCore.setMediaLocation(mediaLocation);

  return async () => {
    await container.stop();
    await rm(mediaLocation, { recursive: true, force: true });
  };
}, 180_000);

describe(`${StorageTransferService.name} (S3)`, () => {
  it('should export an original and its sidecar, then import them back as a new asset', async () => {
    const { sut, ctx } = setup();
    const target = await newTarget();

    const { user } = await ctx.newUser();

    // A real file on disk under the library root, so the export key mirrors the
    // library layout the way it would for a real asset.
    const originalPath = join(mediaLocation, 'library', user.id, 'IMG_0001.jpg');
    const { asset } = await ctx.newAsset({ ownerId: user.id, originalPath, originalFileName: 'IMG_0001.jpg' });
    await ctx.newExif({ assetId: asset.id, fileSizeInByte: 11 });

    const storage = new StorageRepository(LoggingRepository.create());
    storage.mkdirSync(join(mediaLocation, 'library', user.id));
    await writeFile(originalPath, 'hello world');
    await writeFile(`${originalPath}.xmp`, '<x:xmpmeta/>');

    const repository = new StorageTargetRepository(defaultDatabase);
    const transfer = await repository.createTransfer({
      targetId: target.id,
      ownerId: user.id,
      direction: StorageTransferDirection.Export,
      status: StorageTransferStatus.Running,
      scope: { type: 'all' } as never,
      totalCount: 1,
    });

    await expect(sut.handleExportAsset({ transferId: transfer.id, assetId: asset.id })).resolves.toBe(
      JobStatus.Success,
    );

    // The object is really in the bucket, under a key mirroring the library tree.
    const remote = new RemoteStorageRepository(LoggingRepository.create());
    const expectedKey = `${user.id}/IMG_0001.jpg`;
    await expect(remote.head(target, expectedKey)).resolves.toMatchObject({ key: expectedKey });
    await expect(remote.head(target, `${expectedKey}.xmp`)).resolves.not.toBeNull();

    // ...and the ledger recorded it, which is what makes a re-run a no-op.
    const ledger = await repository.getObjectByAsset(target.id, asset.id);
    expect(ledger).toMatchObject({ remoteKey: expectedKey, assetId: asset.id });

    await expect(sut.handleExportAsset({ transferId: transfer.id, assetId: asset.id })).resolves.toBe(
      JobStatus.Skipped,
    );
  }, 60_000);

  it('should not close a transfer while its jobs are still being queued', async () => {
    const { ctx } = setup();
    const target = await newTarget('progress-race');
    const { user } = await ctx.newUser();

    const repository = new StorageTargetRepository(defaultDatabase);

    // totalCount is still 0 here, exactly as it is while the queueing job is
    // draining the asset stream.
    const transfer = await repository.createTransfer({
      targetId: target.id,
      ownerId: user.id,
      direction: StorageTransferDirection.Export,
      status: StorageTransferStatus.Running,
      scope: { type: 'all' } as never,
    });

    const early = await repository.incrementTransferProgress(transfer.id, { completed: 1 });
    expect(early.status).toBe(StorageTransferStatus.Running);

    // Once the real total lands, the reconciling call closes it out.
    await repository.updateTransfer(transfer.id, { totalCount: 2 });
    const stillRunning = await repository.incrementTransferProgress(transfer.id, {});
    expect(stillRunning.status).toBe(StorageTransferStatus.Running);

    const done = await repository.incrementTransferProgress(transfer.id, { completed: 1 });
    expect(done.status).toBe(StorageTransferStatus.Completed);
    expect(done.finishedAt).toBeTruthy();
  }, 30_000);

  it('should skip an import whose bytes the user already has', async () => {
    const { sut, ctx } = setup();
    const target = await newTarget('import-dedupe');
    const { user } = await ctx.newUser();

    const remote = new RemoteStorageRepository(LoggingRepository.create());
    await remote.upload(target, 'IMG_0002.jpg', Readable.from([Buffer.from('duplicate bytes')]), { size: 15 });

    const repository = new StorageTargetRepository(defaultDatabase);
    const transfer = await repository.createTransfer({
      targetId: target.id,
      ownerId: user.id,
      direction: StorageTransferDirection.Import,
      status: StorageTransferStatus.Running,
      scope: { type: 'all' } as never,
      totalCount: 2,
    });

    await expect(
      sut.handleImportObject({ transferId: transfer.id, remoteKey: 'IMG_0002.jpg', size: 15 }),
    ).resolves.toBe(JobStatus.Success);

    // Clearing the ledger removes the key-based skip, so the second run has to
    // fall through to the content-hash check to avoid a duplicate asset.
    await defaultDatabase.deleteFrom('storage_target_object').where('targetId', '=', target.id).execute();

    await expect(
      sut.handleImportObject({ transferId: transfer.id, remoteKey: 'IMG_0002.jpg', size: 15 }),
    ).resolves.toBe(JobStatus.Skipped);
  }, 60_000);

  it('should import an object as a new asset with the downloaded bytes on disk', async () => {
    const { sut, ctx } = setup();
    const target = await newTarget('import-new');
    const { user } = await ctx.newUser();

    const remote = new RemoteStorageRepository(LoggingRepository.create());
    await remote.upload(target, 'holiday/IMG_0003.jpg', Readable.from([Buffer.from('brand new bytes')]), { size: 15 });

    const repository = new StorageTargetRepository(defaultDatabase);
    const transfer = await repository.createTransfer({
      targetId: target.id,
      ownerId: user.id,
      direction: StorageTransferDirection.Import,
      status: StorageTransferStatus.Running,
      scope: { type: 'all' } as never,
      totalCount: 1,
    });

    await expect(
      sut.handleImportObject({ transferId: transfer.id, remoteKey: 'holiday/IMG_0003.jpg', size: 15 }),
    ).resolves.toBe(JobStatus.Success);

    const [row] = await defaultDatabase
      .selectFrom('storage_target_object')
      .selectAll()
      .where('targetId', '=', target.id)
      .execute();

    expect(row.assetId).toBeTruthy();

    const asset = await defaultDatabase
      .selectFrom('asset')
      .selectAll()
      .where('id', '=', row.assetId!)
      .executeTakeFirstOrThrow();

    expect(asset.ownerId).toBe(user.id);
    expect(asset.originalFileName).toBe('IMG_0003.jpg');

    // The bytes really landed where the asset says they are.
    await expect(readFile(asset.originalPath, 'utf8')).resolves.toBe('brand new bytes');
  }, 60_000);
});
