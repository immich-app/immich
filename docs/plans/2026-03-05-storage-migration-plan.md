# Storage Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a bidirectional, idempotent, resumable migration tool to move files between disk and S3 storage backends as a BullMQ background job.

**Architecture:** Two-phase job pattern (orchestrator queues per-file worker jobs). A `storage_migration_log` table tracks every file moved for rollback support. A new `StorageMigrationService` handles all logic, exposed via a `StorageMigrationController` with admin-only endpoints.

**Tech Stack:** NestJS, Kysely (DB), BullMQ (jobs), AWS SDK S3 (storage backend), Vitest (tests), SvelteKit 5 (admin UI)

---

### Task 1: Database Migration — Create `storage_migration_log` Table

**Files:**

- Create: `server/src/schema/migrations/<timestamp>-AddStorageMigrationLog.ts`
- Create: `server/src/schema/tables/storage-migration-log.table.ts`

**Step 1: Write the table schema definition**

Create `server/src/schema/tables/storage-migration-log.table.ts`:

```typescript
import { Column, CreateDateColumn, ForeignKeyColumn, PrimaryGeneratedColumn, Table } from '@immich/sql-tools';
import { Generated } from 'kysely';

@Table('storage_migration_log')
export class StorageMigrationLogTable {
  @PrimaryGeneratedColumn({ type: 'uuid', default: 'immich_uuid_v7()' })
  id!: Generated<string>;

  @Column({ type: 'character varying' })
  entityType!: string;

  @Column({ type: 'uuid' })
  entityId!: string;

  @Column({ type: 'character varying', nullable: true })
  fileType!: string | null;

  @Column({ type: 'text' })
  oldPath!: string;

  @Column({ type: 'text' })
  newPath!: string;

  @Column({ type: 'character varying' })
  direction!: string;

  @Column({ type: 'uuid' })
  batchId!: string;

  @CreateDateColumn({ default: 'clock_timestamp()' })
  migratedAt!: Generated<Date>;
}
```

**Step 2: Register the table in the schema index**

Check `server/src/schema/index.ts` (or equivalent) and add the new table import.

**Step 3: Write the database migration**

Create `server/src/schema/migrations/<timestamp>-AddStorageMigrationLog.ts`:

```typescript
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "storage_migration_log" (
    "id" uuid NOT NULL DEFAULT immich_uuid_v7(),
    "entityType" character varying NOT NULL,
    "entityId" uuid NOT NULL,
    "fileType" character varying,
    "oldPath" text NOT NULL,
    "newPath" text NOT NULL,
    "direction" character varying NOT NULL,
    "batchId" uuid NOT NULL,
    "migratedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT "storage_migration_log_pkey" PRIMARY KEY ("id")
  );`.execute(db);

  await sql`CREATE INDEX "storage_migration_log_batchId_idx" ON "storage_migration_log" ("batchId");`.execute(db);
  await sql`CREATE INDEX "storage_migration_log_entityId_idx" ON "storage_migration_log" ("entityId");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "storage_migration_log";`.execute(db);
}
```

**Step 4: Run the migration to verify**

Run: `cd server && pnpm migrations:run`
Expected: Migration applies successfully.

**Step 5: Commit**

```bash
git add server/src/schema/migrations/*-AddStorageMigrationLog.ts server/src/schema/tables/storage-migration-log.table.ts
git commit -m "feat(server): add storage_migration_log table for disk<->S3 migration tracking"
```

---

### Task 2: Enums & Job Type Definitions

**Files:**

- Modify: `server/src/enum.ts` (add to `QueueName`, `JobName`)
- Modify: `server/src/types.ts` (add job data interfaces and `JobItem` entries)

**Step 1: Add enums**

In `server/src/enum.ts`, add to `QueueName` (after `Editor = 'editor'`):

```typescript
StorageBackendMigration = 'storageBackendMigration',
```

Add to `JobName` (after `WorkflowRun = 'WorkflowRun'`):

```typescript
StorageBackendMigrationQueueAll = 'StorageBackendMigrationQueueAll',
StorageBackendMigration = 'StorageBackendMigration',
```

**Step 2: Add job data interfaces and JobItem entries**

In `server/src/types.ts`, add interfaces:

```typescript
export interface IStorageMigrationJob {
  entityType: 'asset' | 'assetFile' | 'person' | 'user';
  entityId: string;
  fileType: string | null;
  sourcePath: string;
  batchId: string;
  direction: 'toS3' | 'toDisk';
  deleteSource: boolean;
}

export interface IStorageMigrationQueueAllJob {
  direction: 'toS3' | 'toDisk';
  deleteSource: boolean;
  fileTypes: {
    originals: boolean;
    thumbnails: boolean;
    previews: boolean;
    fullsize: boolean;
    encodedVideos: boolean;
    sidecars: boolean;
    personThumbnails: boolean;
    profileImages: boolean;
  };
  concurrency: number;
  batchId: string;
}
```

Add to the `JobItem` discriminated union (before the closing `;`):

```typescript
  // Storage Backend Migration
  | { name: JobName.StorageBackendMigrationQueueAll; data: IStorageMigrationQueueAllJob }
  | { name: JobName.StorageBackendMigration; data: IStorageMigrationJob }
```

**Step 3: Verify types compile**

Run: `cd server && npx tsc --noEmit`
Expected: No type errors.

**Step 4: Commit**

```bash
git add server/src/enum.ts server/src/types.ts
git commit -m "feat(server): add StorageBackendMigration enums and job type definitions"
```

---

### Task 3: Storage Migration Repository

**Files:**

- Create: `server/src/repositories/storage-migration.repository.ts`

**Step 1: Write the repository**

Create `server/src/repositories/storage-migration.repository.ts`. This handles DB queries for the migration log and for streaming files that need migration.

```typescript
import { Injectable } from '@nestjs/common';
import { Insertable, Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB } from 'src/schema';

@Injectable()
export class StorageMigrationRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  /**
   * Stream assets with originalPath on the source backend.
   * For toS3: absolute paths (start with /).
   * For toDisk: relative paths (don't start with /).
   */
  streamOriginals(direction: 'toS3' | 'toDisk') {
    const isAbsolute = direction === 'toS3';
    let query = this.db
      .selectFrom('assets')
      .select(['assets.id', 'assets.ownerId', 'assets.originalPath'])
      .where('assets.deletedAt', 'is', null);

    if (isAbsolute) {
      query = query.where('assets.originalPath', 'like', '/%');
    } else {
      query = query.where('assets.originalPath', 'not like', '/%');
    }

    return query.stream();
  }

  /**
   * Stream asset files (thumbnails, previews, etc.) on the source backend.
   */
  streamAssetFiles(direction: 'toS3' | 'toDisk', fileTypes: string[]) {
    const isAbsolute = direction === 'toS3';
    let query = this.db
      .selectFrom('asset_files')
      .innerJoin('assets', 'assets.id', 'asset_files.assetId')
      .select(['asset_files.id', 'asset_files.assetId', 'asset_files.path', 'asset_files.type', 'assets.ownerId'])
      .where('assets.deletedAt', 'is', null)
      .where('asset_files.type', 'in', fileTypes);

    if (isAbsolute) {
      query = query.where('asset_files.path', 'like', '/%');
    } else {
      query = query.where('asset_files.path', 'not like', '/%');
    }

    return query.stream();
  }

  /**
   * Stream encoded video paths on the source backend.
   */
  streamEncodedVideos(direction: 'toS3' | 'toDisk') {
    const isAbsolute = direction === 'toS3';
    let query = this.db
      .selectFrom('assets')
      .select(['assets.id', 'assets.ownerId', 'assets.encodedVideoPath'])
      .where('assets.deletedAt', 'is', null)
      .where('assets.encodedVideoPath', 'is not', null)
      .where('assets.encodedVideoPath', '!=', '');

    if (isAbsolute) {
      query = query.where('assets.encodedVideoPath', 'like', '/%');
    } else {
      query = query.where('assets.encodedVideoPath', 'not like', '/%');
    }

    return query.stream();
  }

  /**
   * Stream person thumbnails on the source backend.
   */
  streamPersonThumbnails(direction: 'toS3' | 'toDisk') {
    const isAbsolute = direction === 'toS3';
    let query = this.db
      .selectFrom('person')
      .select(['person.id', 'person.ownerId', 'person.thumbnailPath'])
      .where('person.thumbnailPath', '!=', '');

    if (isAbsolute) {
      query = query.where('person.thumbnailPath', 'like', '/%');
    } else {
      query = query.where('person.thumbnailPath', 'not like', '/%');
    }

    return query.stream();
  }

  /**
   * Stream user profile images on the source backend.
   */
  streamProfileImages(direction: 'toS3' | 'toDisk') {
    const isAbsolute = direction === 'toS3';
    let query = this.db
      .selectFrom('users')
      .select(['users.id', 'users.profileImagePath'])
      .where('users.profileImagePath', '!=', '');

    if (isAbsolute) {
      query = query.where('users.profileImagePath', 'like', '/%');
    } else {
      query = query.where('users.profileImagePath', 'not like', '/%');
    }

    return query.stream();
  }

  /**
   * Get the estimated total size of original files to migrate (from exif table).
   */
  async getOriginalsSizeEstimate(direction: 'toS3' | 'toDisk') {
    const isAbsolute = direction === 'toS3';
    let query = this.db
      .selectFrom('exif')
      .innerJoin('assets', 'assets.id', 'exif.assetId')
      .select((eb) => eb.fn.sum<string>('exif.fileSizeInByte').as('totalSize'))
      .where('assets.deletedAt', 'is', null);

    if (isAbsolute) {
      query = query.where('assets.originalPath', 'like', '/%');
    } else {
      query = query.where('assets.originalPath', 'not like', '/%');
    }

    const result = await query.executeTakeFirst();
    return Number(result?.totalSize || 0);
  }

  /**
   * Count files of each type that need migration.
   */
  async getFileCounts(direction: 'toS3' | 'toDisk') {
    const isAbsolute = direction === 'toS3';
    const pathFilter = isAbsolute ? 'like' : ('not like' as const);

    // Count originals
    const originals = await this.db
      .selectFrom('assets')
      .select((eb) => eb.fn.countAll<string>().as('count'))
      .where('assets.deletedAt', 'is', null)
      .where('assets.originalPath', pathFilter, '/%')
      .executeTakeFirst();

    // Count asset files by type
    const assetFiles = await this.db
      .selectFrom('asset_files')
      .innerJoin('assets', 'assets.id', 'asset_files.assetId')
      .select(['asset_files.type', (eb: any) => eb.fn.countAll<string>().as('count')])
      .where('assets.deletedAt', 'is', null)
      .where('asset_files.path', pathFilter, '/%')
      .groupBy('asset_files.type')
      .execute();

    // Count encoded videos
    const encodedVideos = await this.db
      .selectFrom('assets')
      .select((eb) => eb.fn.countAll<string>().as('count'))
      .where('assets.deletedAt', 'is', null)
      .where('assets.encodedVideoPath', 'is not', null)
      .where('assets.encodedVideoPath', '!=', '')
      .where('assets.encodedVideoPath', pathFilter, '/%')
      .executeTakeFirst();

    // Count person thumbnails
    const personThumbnails = await this.db
      .selectFrom('person')
      .select((eb) => eb.fn.countAll<string>().as('count'))
      .where('person.thumbnailPath', '!=', '')
      .where('person.thumbnailPath', pathFilter, '/%')
      .executeTakeFirst();

    // Count profile images
    const profileImages = await this.db
      .selectFrom('users')
      .select((eb) => eb.fn.countAll<string>().as('count'))
      .where('users.profileImagePath', '!=', '')
      .where('users.profileImagePath', pathFilter, '/%')
      .executeTakeFirst();

    return {
      originals: Number(originals?.count || 0),
      thumbnails: Number(assetFiles.find((f) => f.type === 'thumbnail')?.count || 0),
      previews: Number(assetFiles.find((f) => f.type === 'preview')?.count || 0),
      fullsize: Number(assetFiles.find((f) => f.type === 'fullsize')?.count || 0),
      sidecars: Number(assetFiles.find((f) => f.type === 'sidecar')?.count || 0),
      encodedVideos: Number(encodedVideos?.count || 0),
      personThumbnails: Number(personThumbnails?.count || 0),
      profileImages: Number(profileImages?.count || 0),
    };
  }

  /**
   * Update asset originalPath with optimistic concurrency.
   * Returns true if the update succeeded.
   */
  async updateAssetOriginalPath(assetId: string, oldPath: string, newPath: string): Promise<boolean> {
    const result = await this.db
      .updateTable('assets')
      .set({ originalPath: newPath })
      .where('id', '=', assetId)
      .where('originalPath', '=', oldPath)
      .executeTakeFirst();
    return Number(result.numUpdatedRows) > 0;
  }

  /**
   * Update asset encodedVideoPath with optimistic concurrency.
   */
  async updateAssetEncodedVideoPath(assetId: string, oldPath: string, newPath: string): Promise<boolean> {
    const result = await this.db
      .updateTable('assets')
      .set({ encodedVideoPath: newPath })
      .where('id', '=', assetId)
      .where('encodedVideoPath', '=', oldPath)
      .executeTakeFirst();
    return Number(result.numUpdatedRows) > 0;
  }

  /**
   * Update asset file path with optimistic concurrency.
   */
  async updateAssetFilePath(fileId: string, oldPath: string, newPath: string): Promise<boolean> {
    const result = await this.db
      .updateTable('asset_files')
      .set({ path: newPath })
      .where('id', '=', fileId)
      .where('path', '=', oldPath)
      .executeTakeFirst();
    return Number(result.numUpdatedRows) > 0;
  }

  /**
   * Update person thumbnailPath with optimistic concurrency.
   */
  async updatePersonThumbnailPath(personId: string, oldPath: string, newPath: string): Promise<boolean> {
    const result = await this.db
      .updateTable('person')
      .set({ thumbnailPath: newPath })
      .where('id', '=', personId)
      .where('thumbnailPath', '=', oldPath)
      .executeTakeFirst();
    return Number(result.numUpdatedRows) > 0;
  }

  /**
   * Update user profileImagePath with optimistic concurrency.
   */
  async updateUserProfileImagePath(userId: string, oldPath: string, newPath: string): Promise<boolean> {
    const result = await this.db
      .updateTable('users')
      .set({ profileImagePath: newPath })
      .where('id', '=', userId)
      .where('profileImagePath', '=', oldPath)
      .executeTakeFirst();
    return Number(result.numUpdatedRows) > 0;
  }

  /**
   * Insert a migration log entry.
   */
  async createLogEntry(entry: {
    entityType: string;
    entityId: string;
    fileType: string | null;
    oldPath: string;
    newPath: string;
    direction: string;
    batchId: string;
  }) {
    await this.db.insertInto('storage_migration_log').values(entry).execute();
  }

  /**
   * Get all log entries for a batch (for rollback).
   */
  async getLogEntriesByBatch(batchId: string) {
    return this.db.selectFrom('storage_migration_log').selectAll().where('batchId', '=', batchId).execute();
  }

  /**
   * Delete log entries for a batch (after rollback).
   */
  async deleteLogEntriesByBatch(batchId: string) {
    await this.db.deleteFrom('storage_migration_log').where('batchId', '=', batchId).execute();
  }
}
```

**Note:** The exact table/column names will need to match the Kysely schema. Verify against `server/src/schema/index.ts` and adjust. The table names in Kysely are typically the DB names (`assets`, `asset_files`, `person`, `users`, `exif`).

**Step 2: Register the repository**

Add the repository to `server/src/services/base.service.ts` in the `BASE_SERVICE_DEPENDENCIES` array and constructor. Also add to `server/test/utils.ts` in `ServiceOverrides`, `ServiceMocks`, and `newTestService`.

**Step 3: Verify types compile**

Run: `cd server && npx tsc --noEmit`

**Step 4: Commit**

```bash
git add server/src/repositories/storage-migration.repository.ts server/src/services/base.service.ts server/test/utils.ts
git commit -m "feat(server): add StorageMigrationRepository for migration queries and logging"
```

---

### Task 4: Storage Migration Service — Orchestrator & Worker

**Files:**

- Create: `server/src/services/storage-migration.service.ts`

**Step 1: Write the service**

Create `server/src/services/storage-migration.service.ts`:

```typescript
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { isAbsolute } from 'node:path';
import { OnJob } from 'src/decorators';
import { JobName, JobStatus, QueueName } from 'src/enum';
import { StorageBackend } from 'src/interfaces/storage-backend.interface';
import { BaseService } from 'src/services/base.service';
import { StorageService } from 'src/services/storage.service';
import { JobOf, IStorageMigrationJob, IStorageMigrationQueueAllJob } from 'src/types';

const BATCH_SIZE = 1000;

@Injectable()
export class StorageMigrationService extends BaseService {
  /**
   * Validate that the configured backend matches the migration direction.
   */
  private validateBackendConfig(direction: 'toS3' | 'toDisk') {
    const { storage } = this.configRepository.getEnv();
    if (direction === 'toS3' && storage.backend !== 's3') {
      throw new BadRequestException('IMMICH_STORAGE_BACKEND must be set to "s3" before migrating to S3');
    }
    if (direction === 'toDisk' && storage.backend !== 'disk') {
      throw new BadRequestException('IMMICH_STORAGE_BACKEND must be set to "disk" before migrating to disk');
    }
  }

  /**
   * Validate S3 connectivity.
   */
  private async validateS3Connection() {
    const s3Backend = StorageService.getS3Backend();
    if (!s3Backend) {
      throw new BadRequestException('S3 backend is not configured');
    }
    // Try to check if a non-existent key works (tests connectivity)
    try {
      await s3Backend.exists('__immich_connection_test__');
    } catch (error: any) {
      throw new BadRequestException(`S3 connection test failed: ${error.message}`);
    }
  }

  /**
   * Get migration estimate (file counts and size).
   */
  async getEstimate(direction: 'toS3' | 'toDisk') {
    const fileCounts = await this.storageMigrationRepository.getFileCounts(direction);
    const estimatedSizeBytes = await this.storageMigrationRepository.getOriginalsSizeEstimate(direction);
    const total = Object.values(fileCounts).reduce((sum, count) => sum + count, 0);

    return {
      direction,
      fileCounts: { ...fileCounts, total },
      estimatedSizeBytes,
    };
  }

  /**
   * Start a migration. Validates config, then queues the orchestrator job.
   */
  async start(options: {
    direction: 'toS3' | 'toDisk';
    deleteSource: boolean;
    fileTypes: IStorageMigrationQueueAllJob['fileTypes'];
    concurrency: number;
  }) {
    this.validateBackendConfig(options.direction);
    await this.validateS3Connection();

    // Check no migration is already running
    const isActive = await this.jobRepository.isActive(QueueName.StorageBackendMigration);
    if (isActive) {
      throw new BadRequestException('A storage migration is already running');
    }

    const batchId = randomUUID();

    await this.jobRepository.queue({
      name: JobName.StorageBackendMigrationQueueAll,
      data: { ...options, batchId },
    });

    return { batchId };
  }

  /**
   * Get current migration status.
   */
  async getStatus() {
    const isActive = await this.jobRepository.isActive(QueueName.StorageBackendMigration);
    const counts = await this.jobRepository.getJobCounts(QueueName.StorageBackendMigration);
    return { isActive, ...counts };
  }

  /**
   * Orchestrator: streams files from DB, queues worker jobs.
   */
  @OnJob({ name: JobName.StorageBackendMigrationQueueAll, queue: QueueName.StorageBackendMigration })
  async handleQueueAll(job: JobOf<JobName.StorageBackendMigrationQueueAll>): Promise<JobStatus> {
    const { direction, deleteSource, fileTypes, batchId, concurrency } = job;

    this.logger.log(`Starting storage backend migration [direction=${direction}, batch=${batchId}]`);
    this.validateBackendConfig(direction);

    // Set concurrency for worker jobs
    await this.jobRepository.setConcurrency(QueueName.StorageBackendMigration, concurrency);

    let totalQueued = 0;
    let jobs: { name: JobName.StorageBackendMigration; data: IStorageMigrationJob }[] = [];

    const flushJobs = async () => {
      if (jobs.length > 0) {
        await this.jobRepository.queueAll(jobs);
        totalQueued += jobs.length;
        jobs = [];
        this.logger.log(`Queued ${totalQueued} files for migration`);
      }
    };

    const addJob = async (data: IStorageMigrationJob) => {
      jobs.push({ name: JobName.StorageBackendMigration, data });
      if (jobs.length >= BATCH_SIZE) {
        await flushJobs();
      }
    };

    // Stream originals
    if (fileTypes.originals) {
      for await (const asset of this.storageMigrationRepository.streamOriginals(direction)) {
        await addJob({
          entityType: 'asset',
          entityId: asset.id,
          fileType: 'original',
          sourcePath: asset.originalPath,
          batchId,
          direction,
          deleteSource,
        });
      }
    }

    // Stream asset files (thumbnails, previews, fullsize, sidecars)
    const assetFileTypes: string[] = [];
    if (fileTypes.thumbnails) assetFileTypes.push('thumbnail');
    if (fileTypes.previews) assetFileTypes.push('preview');
    if (fileTypes.fullsize) assetFileTypes.push('fullsize');
    if (fileTypes.sidecars) assetFileTypes.push('sidecar');

    if (assetFileTypes.length > 0) {
      for await (const file of this.storageMigrationRepository.streamAssetFiles(direction, assetFileTypes)) {
        await addJob({
          entityType: 'assetFile',
          entityId: file.id,
          fileType: file.type,
          sourcePath: file.path,
          batchId,
          direction,
          deleteSource,
        });
      }
    }

    // Stream encoded videos
    if (fileTypes.encodedVideos) {
      for await (const asset of this.storageMigrationRepository.streamEncodedVideos(direction)) {
        await addJob({
          entityType: 'asset',
          entityId: asset.id,
          fileType: 'encodedVideo',
          sourcePath: asset.encodedVideoPath!,
          batchId,
          direction,
          deleteSource,
        });
      }
    }

    // Stream person thumbnails
    if (fileTypes.personThumbnails) {
      for await (const person of this.storageMigrationRepository.streamPersonThumbnails(direction)) {
        await addJob({
          entityType: 'person',
          entityId: person.id,
          fileType: null,
          sourcePath: person.thumbnailPath,
          batchId,
          direction,
          deleteSource,
        });
      }
    }

    // Stream profile images
    if (fileTypes.profileImages) {
      for await (const user of this.storageMigrationRepository.streamProfileImages(direction)) {
        await addJob({
          entityType: 'user',
          entityId: user.id,
          fileType: null,
          sourcePath: user.profileImagePath,
          batchId,
          direction,
          deleteSource,
        });
      }
    }

    await flushJobs();
    this.logger.log(`Storage backend migration orchestrator complete. Queued ${totalQueued} files [batch=${batchId}]`);

    return JobStatus.Success;
  }

  /**
   * Worker: migrates a single file.
   */
  @OnJob({ name: JobName.StorageBackendMigration, queue: QueueName.StorageBackendMigration })
  async handleMigration(job: JobOf<JobName.StorageBackendMigration>): Promise<JobStatus> {
    const { entityType, entityId, fileType, sourcePath, batchId, direction, deleteSource } = job;

    // Resolve source and target backends
    const sourceBackend = this.resolveSourceBackend(direction);
    const targetBackend = this.resolveTargetBackend(direction);

    // Compute the target key/path
    const targetPath = this.computeTargetPath(sourcePath, direction);

    try {
      // Check if source exists
      const sourceExists = await sourceBackend.exists(sourcePath);
      if (!sourceExists) {
        this.logger.warn(`Source file not found, skipping: ${sourcePath}`);
        return JobStatus.Skipped;
      }

      // Check if target already exists (idempotency)
      const targetExists = await targetBackend.exists(targetPath);
      if (!targetExists) {
        // Copy: read from source, write to target
        const { stream } = await sourceBackend.get(sourcePath);
        await targetBackend.put(targetPath, stream);
      }

      // Update DB path with optimistic concurrency
      const updated = await this.updatePath(entityType, entityId, fileType, sourcePath, targetPath);
      if (!updated) {
        this.logger.warn(`Optimistic concurrency conflict for ${entityType}:${entityId}, skipping`);
        return JobStatus.Skipped;
      }

      // Log the migration
      await this.storageMigrationRepository.createLogEntry({
        entityType,
        entityId,
        fileType,
        oldPath: sourcePath,
        newPath: targetPath,
        direction,
        batchId,
      });

      // Optionally delete source
      if (deleteSource) {
        try {
          await sourceBackend.delete(sourcePath);
        } catch (error: any) {
          this.logger.warn(`Failed to delete source file ${sourcePath}: ${error.message}`);
        }
      }

      return JobStatus.Success;
    } catch (error: any) {
      this.logger.error(`Failed to migrate ${entityType}:${entityId} (${sourcePath}): ${error.message}`);
      return JobStatus.Failed;
    }
  }

  /**
   * Rollback a migration batch.
   */
  async rollback(batchId: string) {
    const entries = await this.storageMigrationRepository.getLogEntriesByBatch(batchId);
    if (entries.length === 0) {
      throw new BadRequestException(`No migration entries found for batch ${batchId}`);
    }

    let rolledBack = 0;
    let failed = 0;

    for (const entry of entries) {
      try {
        const updated = await this.updatePath(
          entry.entityType,
          entry.entityId,
          entry.fileType,
          entry.newPath,
          entry.oldPath,
        );
        if (updated) {
          rolledBack++;
        } else {
          failed++;
          this.logger.warn(`Failed to rollback ${entry.entityType}:${entry.entityId} - path already changed`);
        }
      } catch (error: any) {
        failed++;
        this.logger.error(`Error rolling back ${entry.entityType}:${entry.entityId}: ${error.message}`);
      }
    }

    if (failed === 0) {
      await this.storageMigrationRepository.deleteLogEntriesByBatch(batchId);
    }

    return { rolledBack, failed, total: entries.length };
  }

  // --- Private helpers ---

  private resolveSourceBackend(direction: 'toS3' | 'toDisk'): StorageBackend {
    return direction === 'toS3' ? StorageService.getDiskBackend() : StorageService.getS3Backend()!;
  }

  private resolveTargetBackend(direction: 'toS3' | 'toDisk'): StorageBackend {
    return direction === 'toS3' ? StorageService.getS3Backend()! : StorageService.getDiskBackend();
  }

  /**
   * Convert an absolute disk path to a relative S3 key or vice versa.
   *
   * toS3: /usr/src/app/upload/library/user/ab/cd/file.jpg → library/user/ab/cd/file.jpg
   * toDisk: library/user/ab/cd/file.jpg → /usr/src/app/upload/library/user/ab/cd/file.jpg
   */
  private computeTargetPath(sourcePath: string, direction: 'toS3' | 'toDisk'): string {
    const mediaLocation = StorageCore.getMediaLocation();
    if (direction === 'toS3') {
      // Strip the media location prefix to get relative key
      const prefix = mediaLocation.endsWith('/') ? mediaLocation : mediaLocation + '/';
      if (sourcePath.startsWith(prefix)) {
        return sourcePath.slice(prefix.length);
      }
      // Fallback: just strip leading /
      return sourcePath.replace(/^\/+/, '');
    } else {
      // Prepend media location to get absolute path
      return `${mediaLocation}/${sourcePath}`;
    }
  }

  private async updatePath(
    entityType: string,
    entityId: string,
    fileType: string | null,
    oldPath: string,
    newPath: string,
  ): Promise<boolean> {
    switch (entityType) {
      case 'asset':
        if (fileType === 'original') {
          return this.storageMigrationRepository.updateAssetOriginalPath(entityId, oldPath, newPath);
        }
        if (fileType === 'encodedVideo') {
          return this.storageMigrationRepository.updateAssetEncodedVideoPath(entityId, oldPath, newPath);
        }
        return false;
      case 'assetFile':
        return this.storageMigrationRepository.updateAssetFilePath(entityId, oldPath, newPath);
      case 'person':
        return this.storageMigrationRepository.updatePersonThumbnailPath(entityId, oldPath, newPath);
      case 'user':
        return this.storageMigrationRepository.updateUserProfileImagePath(entityId, oldPath, newPath);
      default:
        return false;
    }
  }
}
```

**Note:** You'll need to import `StorageCore` from `src/cores/storage.core`. Also ensure `storageMigrationRepository` is available via `BaseService` (added in Task 3).

**Step 2: Verify types compile**

Run: `cd server && npx tsc --noEmit`

**Step 3: Commit**

```bash
git add server/src/services/storage-migration.service.ts
git commit -m "feat(server): add StorageMigrationService with orchestrator, worker, and rollback"
```

---

### Task 5: Storage Migration Service — Unit Tests

**Files:**

- Create: `server/src/services/storage-migration.service.spec.ts`

**Step 1: Write tests for the service**

Write tests using `newTestService(StorageMigrationService)` pattern from `server/test/utils.ts`. Key test cases:

1. `getEstimate` — returns file counts and size from repository
2. `start` — validates backend config, checks no active migration, queues orchestrator
3. `start` — throws if backend config doesn't match direction
4. `start` — throws if migration already active
5. `handleQueueAll` — streams files and queues worker jobs
6. `handleMigration` — copies file, updates DB path, writes log
7. `handleMigration` — skips when source not found
8. `handleMigration` — skips on optimistic concurrency conflict
9. `handleMigration` — deletes source when deleteSource is true
10. `rollback` — reverts paths and clears log entries

Follow the existing test patterns in `server/src/services/storage.service.spec.ts` or `server/src/services/media.service.spec.ts` for mock setup conventions.

Use `makeStream()` from `server/test/utils.ts` for streaming mock data.

**Step 2: Run tests to verify they pass**

Run: `cd server && pnpm test -- --run src/services/storage-migration.service.spec.ts`

**Step 3: Commit**

```bash
git add server/src/services/storage-migration.service.spec.ts
git commit -m "test(server): add unit tests for StorageMigrationService"
```

---

### Task 6: Controller & DTOs

**Files:**

- Create: `server/src/controllers/storage-migration.controller.ts`
- Create: `server/src/dtos/storage-migration.dto.ts`
- Modify: `server/src/controllers/index.ts` (add controller)

**Step 1: Write the DTOs**

Create `server/src/dtos/storage-migration.dto.ts`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsUUID, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class StorageMigrationFileTypesDto {
  @IsBoolean()
  @IsOptional()
  originals: boolean = true;

  @IsBoolean()
  @IsOptional()
  thumbnails: boolean = true;

  @IsBoolean()
  @IsOptional()
  previews: boolean = true;

  @IsBoolean()
  @IsOptional()
  fullsize: boolean = true;

  @IsBoolean()
  @IsOptional()
  encodedVideos: boolean = true;

  @IsBoolean()
  @IsOptional()
  sidecars: boolean = true;

  @IsBoolean()
  @IsOptional()
  personThumbnails: boolean = true;

  @IsBoolean()
  @IsOptional()
  profileImages: boolean = true;
}

export class StorageMigrationStartDto {
  @IsEnum(['toS3', 'toDisk'])
  direction!: 'toS3' | 'toDisk';

  @IsBoolean()
  @IsOptional()
  deleteSource: boolean = false;

  @ValidateNested()
  @Type(() => StorageMigrationFileTypesDto)
  @IsOptional()
  fileTypes: StorageMigrationFileTypesDto = new StorageMigrationFileTypesDto();

  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  concurrency: number = 5;
}

export class StorageMigrationEstimateQueryDto {
  @IsEnum(['toS3', 'toDisk'])
  direction!: 'toS3' | 'toDisk';
}

export class StorageMigrationBatchParamDto {
  @IsUUID()
  batchId!: string;
}
```

**Step 2: Write the controller**

Create `server/src/controllers/storage-migration.controller.ts`:

```typescript
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import {
  StorageMigrationBatchParamDto,
  StorageMigrationEstimateQueryDto,
  StorageMigrationStartDto,
} from 'src/dtos/storage-migration.dto';
import { ApiTag, Permission } from 'src/enum';
import { Authenticated } from 'src/middleware/auth.guard';
import { StorageMigrationService } from 'src/services/storage-migration.service';

@ApiTags(ApiTag.Jobs)
@Controller('storage-migration')
export class StorageMigrationController {
  constructor(private service: StorageMigrationService) {}

  @Get('estimate')
  @Authenticated({ permission: Permission.JobRead, admin: true })
  @Endpoint({
    summary: 'Get storage migration estimate',
    description: 'Returns file counts and estimated data size for the specified migration direction.',
    history: new HistoryBuilder().added('v2.5.0').alpha('v2.5.0'),
  })
  getEstimate(@Query() { direction }: StorageMigrationEstimateQueryDto) {
    return this.service.getEstimate(direction);
  }

  @Post('start')
  @Authenticated({ permission: Permission.JobCreate, admin: true })
  @HttpCode(HttpStatus.CREATED)
  @Endpoint({
    summary: 'Start storage migration',
    description: 'Starts a migration of files between disk and S3 backends.',
    history: new HistoryBuilder().added('v2.5.0').alpha('v2.5.0'),
  })
  start(@Body() dto: StorageMigrationStartDto) {
    return this.service.start(dto);
  }

  @Get('status')
  @Authenticated({ permission: Permission.JobRead, admin: true })
  @Endpoint({
    summary: 'Get storage migration status',
    description: 'Returns the current status of the storage migration job.',
    history: new HistoryBuilder().added('v2.5.0').alpha('v2.5.0'),
  })
  getStatus() {
    return this.service.getStatus();
  }

  @Post('rollback/:batchId')
  @Authenticated({ permission: Permission.JobCreate, admin: true })
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Rollback a storage migration batch',
    description: 'Reverts all file path changes from a specific migration batch.',
    history: new HistoryBuilder().added('v2.5.0').alpha('v2.5.0'),
  })
  rollback(@Param() { batchId }: StorageMigrationBatchParamDto) {
    return this.service.rollback(batchId);
  }
}
```

**Step 3: Register the controller**

In `server/src/controllers/index.ts`, add:

```typescript
import { StorageMigrationController } from 'src/controllers/storage-migration.controller';
```

And add `StorageMigrationController` to the `controllers` array.

**Step 4: Verify types compile**

Run: `cd server && npx tsc --noEmit`

**Step 5: Commit**

```bash
git add server/src/controllers/storage-migration.controller.ts server/src/dtos/storage-migration.dto.ts server/src/controllers/index.ts
git commit -m "feat(server): add StorageMigrationController with estimate, start, status, and rollback endpoints"
```

---

### Task 7: Wire Up Queue & Job Service

**Files:**

- Modify: `server/src/services/queue.service.ts` (add to start switch)

**Step 1: Add to queue start switch**

In `server/src/services/queue.service.ts`, in the `start()` method's switch statement, add a case:

```typescript
case QueueName.StorageBackendMigration: {
  // Storage backend migration is started via its own controller, not the generic queue start
  throw new BadRequestException('Use /storage-migration/start to begin a migration');
}
```

This prevents the generic queue start from being used — migration must go through the dedicated controller which validates config.

**Step 2: Verify types compile**

Run: `cd server && npx tsc --noEmit`

**Step 3: Commit**

```bash
git add server/src/services/queue.service.ts
git commit -m "feat(server): wire StorageBackendMigration queue into queue service"
```

---

### Task 8: OpenAPI Regeneration

**Step 1: Build server**

Run: `cd server && pnpm build`

**Step 2: Regenerate OpenAPI specs**

Run: `cd server && pnpm sync:open-api`

**Step 3: Regenerate TypeScript SDK**

Run: `make open-api-typescript` (from repo root)

**Step 4: Verify build**

Run: `cd server && npx tsc --noEmit`

**Step 5: Commit**

```bash
git add open-api/ server/immich-openapi-specs.json
git commit -m "chore: regenerate OpenAPI specs and TypeScript SDK for storage migration endpoints"
```

---

### Task 9: Admin UI — Storage Migration Page

**Files:**

- Create: `web/src/routes/admin/storage-migration/+page.svelte`
- Create: `web/src/routes/admin/storage-migration/+page.ts`

**Step 1: Create the page load function**

Create `web/src/routes/admin/storage-migration/+page.ts`:

```typescript
export const load = () => {
  return {
    meta: {
      title: 'Storage Migration',
    },
  };
};
```

**Step 2: Create the admin page**

Create `web/src/routes/admin/storage-migration/+page.svelte`. This page should include:

- Direction selector (radio buttons: "Disk → S3" / "S3 → Disk")
- File type checkboxes (originals, thumbnails, previews, fullsize, encoded videos, sidecars, person thumbnails, profile images)
- Delete source toggle
- Concurrency slider (1-20, default 5)
- Estimate display (file counts table + estimated size)
- Start button (calls `POST /storage-migration/start`)
- Status display (shows active/idle, job counts from `GET /storage-migration/status`)
- Rollback section (input batch ID, rollback button)

Use the `@immich/sdk` generated client for API calls. Follow the patterns in existing admin pages (e.g., `web/src/routes/admin/queues/+page.svelte`). Use Svelte 5 runes (`$state`, `$derived`, `$effect`).

Use `AdminPageLayout` component for consistent styling. Use `@immich/ui` components (Button, Input, etc.) where available.

**Step 3: Add navigation link**

Add a link to the storage migration page in the admin sidebar/navigation. Check how other admin pages are linked (look in `web/src/lib/components/layouts/` or the admin layout files).

**Step 4: Verify web build**

Run: `make build-web` (from repo root, requires SDK to be built first)

**Step 5: Commit**

```bash
git add web/src/routes/admin/storage-migration/
git commit -m "feat(web): add admin storage migration page with estimate, start, status, and rollback"
```

---

### Task 10: Integration Testing & Final Verification

**Step 1: Run all server unit tests**

Run: `cd server && pnpm test -- --run`
Expected: All tests pass, including new storage migration tests.

**Step 2: Run lint and type checks**

Run: `make check-server && make lint-server && make check-web && make lint-web`
Expected: No errors.

**Step 3: Run format**

Run: `make format-server && make format-web`

**Step 4: Final commit if any formatting changes**

```bash
git add -A
git commit -m "chore: format storage migration code"
```

---

## Key Implementation Notes

### Table/Column Name Mapping

Verify exact Kysely table names by checking `server/src/schema/index.ts`. The queries in the repository use the DB table names (e.g., `assets`, `asset_files`, `person`, `users`, `exif`).

### Path Conversion Logic

- **Disk → S3**: Strip the `IMMICH_MEDIA_LOCATION` prefix (e.g., `/usr/src/app/upload/`) to get a relative key.
- **S3 → Disk**: Prepend `IMMICH_MEDIA_LOCATION` to get an absolute path.
- This matches the existing convention: `isAbsolute(path)` → disk, relative → S3.

### StorageCore Import

The `StorageMigrationService` needs `StorageCore` from `src/cores/storage.core` for `getMediaLocation()`.

### BaseService Extension

Adding `StorageMigrationRepository` to `BaseService` touches multiple files. Follow the exact pattern of existing repositories — check alphabetical ordering in the constructor parameter list and `ServiceOverrides` type.

### Test Patterns

- Use `newTestService(StorageMigrationService)` to get auto-mocked dependencies.
- Use `makeStream()` helper from `test/utils.ts` to create async iterators for streaming mocks.
- Mock `StorageService.getDiskBackend()` and `StorageService.getS3Backend()` as static method mocks.
