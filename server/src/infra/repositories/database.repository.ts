import {
  DatabaseExtension,
  DatabaseLock,
  IDatabaseRepository,
  VectorExtension,
  Version,
  VersionType,
  extName,
} from '@app/domain';
import { vectorExt } from '@app/infra/database.config';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import AsyncLock from 'async-lock';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';

@Injectable()
export class DatabaseRepository implements IDatabaseRepository {
  readonly asyncLock = new AsyncLock();

  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getExtensionVersion(extension: DatabaseExtension): Promise<Version | null> {
    const res = await this.dataSource.query(`SELECT extversion FROM pg_extension WHERE extname = $1`, [extension]);
    const version = res[0]?.['extversion'];
    return version == null ? null : Version.fromString(version);
  }

  async getAvailableExtensionVersion(extension: DatabaseExtension): Promise<Version | null> {
    const res = await this.dataSource.query(
      `
    SELECT version FROM pg_available_extension_versions
    WHERE name = $1 AND installed = false 
    ORDER BY version DESC`,
      [extension],
    );
    const version = res[0]?.['version'];
    return version == null ? null : Version.fromString(version);
  }

  getPreferredVectorExtension(): VectorExtension {
    return vectorExt;
  }

  async getPostgresVersion(): Promise<Version> {
    const res = await this.dataSource.query(`SHOW server_version`);
    return Version.fromString(res[0]['server_version']);
  }

  async createExtension(extension: DatabaseExtension): Promise<void> {
    await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS ${extension}`);
  }

  async updateExtension(extension: DatabaseExtension, version?: Version): Promise<void> {
    await this.dataSource.query(`ALTER EXTENSION ${extension} UPDATE${version ? ` TO '${version}'` : ''}`);
  }

  async setSearchPath(): Promise<void> {
    await this.dataSource.query(`ALTER DATABASE immich SET search_path TO "$user", public, vectors`);
  }

  async updateVectorExtension(extension: VectorExtension, version?: Version): Promise<void> {
    await this.dataSource.manager.transaction(async (manager) => {
      let curVersion = await this.getExtensionVersion(extension);
      if (!curVersion) {
        throw new Error(`${extName[extension]} extension is not installed`);
      }

      if (DatabaseExtension.VECTORS && version && curVersion.isOlderThan(version) >= VersionType.MINOR) {
        this.vectorDown(manager);
        this.vectorUp(manager);
      }

      await manager.query(`ALTER EXTENSION ${extension} UPDATE${version ? ` TO '${version}-alpha'` : ''}`);
    });
  }

  private async vectorUp(manager: EntityManager): Promise<void> {
    await manager.query(`CREATE EXTENSION IF NOT EXISTS ${vectorExt}`);
    if (vectorExt === DatabaseExtension.VECTORS) {
      await manager.query(`
      ALTER DATABASE immich
      SET search_path TO "$user", public, vectors`);
    }

    await manager.query(`
      ALTER TABLE smart_search
      ALTER COLUMN "embedding" TYPE vector(768)`);
    await manager.query(`
      ALTER TABLE asset_faces
      ALTER COLUMN "embedding" TYPE vector(512)`);

    await this.createVectorIndex(this.dataSource.manager, 'clip_index', 'smart_search');
    await this.createVectorIndex(this.dataSource.manager, 'face_index', 'asset_faces');
  }

  private async vectorDown(manager: EntityManager): Promise<void> {
    await manager.query(`DROP INDEX IF EXISTS clip_index`);
    await manager.query(`DROP INDEX IF EXISTS face_index`);
    await manager.query(`
      ALTER TABLE smart_search
      ALTER COLUMN "embedding" TYPE real[]`);
    await manager.query(`
      ALTER TABLE asset_faces
      ALTER COLUMN "embedding" TYPE real[]`);
    await manager.query(`DROP EXTENSION IF EXISTS ${vectorExt}`);
  }

  private async createVectorIndex(manager: EntityManager, indexName: string, table: string): Promise<void> {
    if (vectorExt === DatabaseExtension.VECTORS) {
      await manager.query(`SET vectors.pgvector_compatibility=on`);
    }

    await manager.query(`
      CREATE INDEX IF NOT EXISTS ${indexName} ON ${table}
      USING hnsw (embedding vector_cosine_ops)
      WITH (ef_construction = 300, m = 16)`);
  }

  async runMigrations(options?: { transaction?: 'all' | 'none' | 'each' }): Promise<void> {
    await this.dataSource.runMigrations(options);
  }

  async withLock<R>(lock: DatabaseLock, callback: () => Promise<R>): Promise<R> {
    let res;
    await this.asyncLock.acquire(DatabaseLock[lock], async () => {
      const queryRunner = this.dataSource.createQueryRunner();
      try {
        await this.acquireLock(lock, queryRunner);
        res = await callback();
      } finally {
        try {
          await this.releaseLock(lock, queryRunner);
        } finally {
          await queryRunner.release();
        }
      }
    });

    return res as R;
  }

  isBusy(lock: DatabaseLock): boolean {
    return this.asyncLock.isBusy(DatabaseLock[lock]);
  }

  async wait(lock: DatabaseLock): Promise<void> {
    await this.asyncLock.acquire(DatabaseLock[lock], () => {});
  }

  private async acquireLock(lock: DatabaseLock, queryRunner: QueryRunner): Promise<void> {
    return queryRunner.query('SELECT pg_advisory_lock($1)', [lock]);
  }

  private async releaseLock(lock: DatabaseLock, queryRunner: QueryRunner): Promise<void> {
    return queryRunner.query('SELECT pg_advisory_unlock($1)', [lock]);
  }
}
