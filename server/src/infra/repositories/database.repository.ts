import {
  DatabaseExtension,
  DatabaseLock,
  IDatabaseRepository,
  VectorExtension,
  VectorIndex,
  VectorUpdateResult,
  Version,
  VersionType,
  extName,
} from '@app/domain';
import { vectorExt } from '@app/infra/database.config';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import AsyncLock from 'async-lock';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { isValidInteger } from '../infra.utils';
import { ImmichLogger } from '../logger';

@Injectable()
export class DatabaseRepository implements IDatabaseRepository {
  private logger = new ImmichLogger(DatabaseRepository.name);
  readonly asyncLock = new AsyncLock();

  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getExtensionVersion(extension: DatabaseExtension): Promise<Version | null> {
    const res = await this.dataSource.query(`SELECT extversion FROM pg_extension WHERE extname = $1`, [extension]);
    const extVersion = res[0]?.['extversion'];
    if (extVersion == null) {
      return null;
    }

    const version = Version.fromString(extVersion);
    if (version.isEqual(new Version(0, 1, 1))) {
      return new Version(0, 1, 11);
    }

    return version;
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

  async updateVectorExtension(extension: VectorExtension, version?: Version): Promise<VectorUpdateResult> {
    const curVersion = await this.getExtensionVersion(extension);
    if (!curVersion) {
      throw new Error(`${extName[extension]} extension is not installed`);
    }

    const minorOrMajor = version && curVersion.isOlderThan(version) >= VersionType.MINOR;
    const isVectors = extension === DatabaseExtension.VECTORS;
    let restartRequired = false;
    await this.dataSource.manager.transaction(async (manager) => {
      await this.setSearchPath(manager);
      if (minorOrMajor && isVectors) {
        await this.updateVectorsSchema(manager, curVersion);
      }

      await manager.query(`ALTER EXTENSION ${extension} UPDATE${version ? ` TO '${version}'` : ''}`);

      if (!minorOrMajor) {
        return;
      }

      if (isVectors) {
        await manager.query('SELECT pgvectors_upgrade()');
        restartRequired = true;
      } else {
        await this.reindex(VectorIndex.CLIP);
        await this.reindex(VectorIndex.FACE);
      }
    });

    return { restartRequired };
  }

  async reindex(index: VectorIndex): Promise<void> {
    try {
      await this.dataSource.query(`REINDEX INDEX ${index}`);
    } catch (error) {
      if (vectorExt === DatabaseExtension.VECTORS) {
        this.logger.warn(`Could not reindex index ${index}. Attempting to auto-fix.`);
        const table = index === VectorIndex.CLIP ? 'smart_search' : 'asset_faces';
        const dimSize = await this.getDimSize(table);
        await this.dataSource.manager.transaction(async (manager) => {
          await this.setSearchPath(manager);
          await manager.query(`DROP INDEX IF EXISTS ${index}`);
          await manager.query(`ALTER TABLE ${table} ALTER COLUMN embedding SET DATA TYPE real[]`);
          await manager.query(`ALTER TABLE ${table} ALTER COLUMN embedding SET DATA TYPE vector(${dimSize})`);
          await manager.query(`SET vectors.pgvector_compatibility=on`);
          await manager.query(`
            CREATE INDEX IF NOT EXISTS ${index} ON ${table}
            USING hnsw (embedding vector_cosine_ops)
            WITH (ef_construction = 300, m = 16)`);
        });
      } else {
        throw error;
      }
    }
  }

  async shouldReindex(name: VectorIndex): Promise<boolean> {
    if (vectorExt !== DatabaseExtension.VECTORS) {
      return false;
    }

    try {
      const res = await this.dataSource.query(
        `
          SELECT idx_status
          FROM pg_vector_index_stat
          WHERE indexname = $1`,
        [name],
      );
      return res[0]?.['idx_status'] === 'UPGRADE';
    } catch (error) {
      const message: string = (error as any).message;
      if (message.includes('index is not existing')) {
        return true;
      } else if (message.includes('relation "pg_vector_index_stat" does not exist')) {
        return false;
      }
      throw error;
    }
  }

  private async setSearchPath(manager: EntityManager): Promise<void> {
    await manager.query(`SET search_path TO "$user", public, vectors`);
  }

  private async updateVectorsSchema(manager: EntityManager, curVersion: Version): Promise<void> {
    await manager.query('CREATE SCHEMA IF NOT EXISTS vectors');
    await manager.query(`UPDATE pg_catalog.pg_extension SET extversion = $1 WHERE extname = $2`, [
      curVersion.toString(),
      DatabaseExtension.VECTORS,
    ]);
    await manager.query('UPDATE pg_catalog.pg_extension SET extrelocatable = true WHERE extname = $1', [
      DatabaseExtension.VECTORS,
    ]);
    await manager.query('ALTER EXTENSION vectors SET SCHEMA vectors');
    await manager.query('UPDATE pg_catalog.pg_extension SET extrelocatable = false WHERE extname = $1', [
      DatabaseExtension.VECTORS,
    ]);
  }

  private async getDimSize(table: string, column = 'embedding'): Promise<number> {
    const res = await this.dataSource.query(`
      SELECT atttypmod as dimsize
      FROM pg_attribute f
        JOIN pg_class c ON c.oid = f.attrelid
      WHERE c.relkind = 'r'::char
        AND f.attnum > 0
        AND c.relname = '${table}'
        AND f.attname = '${column}'`);

    const dimSize = res[0]['dimsize'];
    if (!isValidInteger(dimSize, { min: 1, max: 2 ** 16 })) {
      throw new Error(`Could not retrieve dimension size`);
    }
    return dimSize;
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
