import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import AsyncLock from 'async-lock';
import semver from 'semver';
import { POSTGRES_VERSION_RANGE, VECTOR_VERSION_RANGE, VECTORS_VERSION_RANGE } from 'src/constants';
import { IConfigRepository } from 'src/interfaces/config.interface';
import {
  DatabaseExtension,
  DatabaseLock,
  EXTENSION_NAMES,
  ExtensionVersion,
  IDatabaseRepository,
  VectorExtension,
  VectorIndex,
  VectorUpdateResult,
} from 'src/interfaces/database.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { isValidInteger } from 'src/validation';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';

@Instrumentation()
@Injectable()
export class DatabaseRepository implements IDatabaseRepository {
  private vectorExtension: VectorExtension;
  readonly asyncLock = new AsyncLock();

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
    @Inject(IConfigRepository) configRepository: IConfigRepository,
  ) {
    this.vectorExtension = configRepository.getEnv().database.vectorExtension;
    this.logger.setContext(DatabaseRepository.name);
  }

  async reconnect() {
    try {
      if (this.dataSource.isInitialized) {
        await this.dataSource.destroy();
      }
      const { isInitialized } = await this.dataSource.initialize();
      return isInitialized;
    } catch (error) {
      this.logger.error(`Database connection failed: ${error}`);
      return false;
    }
  }

  async getExtensionVersion(extension: DatabaseExtension): Promise<ExtensionVersion> {
    const [res]: ExtensionVersion[] = await this.dataSource.query(
      `SELECT default_version as "availableVersion", installed_version as "installedVersion"
      FROM pg_available_extensions
      WHERE name = $1`,
      [extension],
    );
    return res ?? { availableVersion: null, installedVersion: null };
  }

  getExtensionVersionRange(extension: VectorExtension): string {
    return extension === DatabaseExtension.VECTORS ? VECTORS_VERSION_RANGE : VECTOR_VERSION_RANGE;
  }

  async getPostgresVersion(): Promise<string> {
    const [{ server_version: version }] = await this.dataSource.query(`SHOW server_version`);
    return version;
  }

  getPostgresVersionRange(): string {
    return POSTGRES_VERSION_RANGE;
  }

  async createExtension(extension: DatabaseExtension): Promise<void> {
    await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS ${extension}`);
  }

  async updateExtension(extension: DatabaseExtension, version?: string): Promise<void> {
    await this.dataSource.query(`ALTER EXTENSION ${extension} UPDATE${version ? ` TO '${version}'` : ''}`);
  }

  async updateVectorExtension(extension: VectorExtension, targetVersion?: string): Promise<VectorUpdateResult> {
    const { availableVersion, installedVersion } = await this.getExtensionVersion(extension);
    if (!installedVersion) {
      throw new Error(`${EXTENSION_NAMES[extension]} extension is not installed`);
    }

    if (!availableVersion) {
      throw new Error(`No available version for ${EXTENSION_NAMES[extension]} extension`);
    }
    targetVersion ??= availableVersion;

    const isVectors = extension === DatabaseExtension.VECTORS;
    let restartRequired = false;
    await this.dataSource.manager.transaction(async (manager) => {
      await this.setSearchPath(manager);

      if (isVectors && installedVersion === '0.1.1') {
        await this.setExtVersion(manager, DatabaseExtension.VECTORS, '0.1.11');
      }

      const isSchemaUpgrade = semver.satisfies(installedVersion, '0.1.1 || 0.1.11');
      if (isSchemaUpgrade && isVectors) {
        await this.updateVectorsSchema(manager);
      }

      await manager.query(`ALTER EXTENSION ${extension} UPDATE TO '${targetVersion}'`);

      const diff = semver.diff(installedVersion, targetVersion);
      if (isVectors && diff && ['minor', 'major'].includes(diff)) {
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
      if (this.vectorExtension !== DatabaseExtension.VECTORS) {
        throw error;
      }
      this.logger.warn(`Could not reindex index ${index}. Attempting to auto-fix.`);

      const table = await this.getIndexTable(index);
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
    }
  }

  async shouldReindex(name: VectorIndex): Promise<boolean> {
    if (this.vectorExtension !== DatabaseExtension.VECTORS) {
      return false;
    }

    try {
      const query = `SELECT idx_status FROM pg_vector_index_stat WHERE indexname = $1`;
      const res = await this.dataSource.query(query, [name]);
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

  private async setExtVersion(manager: EntityManager, extName: DatabaseExtension, version: string): Promise<void> {
    const query = `UPDATE pg_catalog.pg_extension SET extversion = $1 WHERE extname = $2`;
    await manager.query(query, [version, extName]);
  }

  private async getIndexTable(index: VectorIndex): Promise<string> {
    const tableQuery = `SELECT relname FROM pg_stat_all_indexes WHERE indexrelname = $1`;
    const [res]: { relname: string | null }[] = await this.dataSource.manager.query(tableQuery, [index]);
    const table = res?.relname;
    if (!table) {
      throw new Error(`Could not find table for index ${index}`);
    }
    return table;
  }

  private async updateVectorsSchema(manager: EntityManager): Promise<void> {
    const extension = DatabaseExtension.VECTORS;
    await manager.query(`CREATE SCHEMA IF NOT EXISTS ${extension}`);
    await manager.query('UPDATE pg_catalog.pg_extension SET extrelocatable = true WHERE extname = $1', [extension]);
    await manager.query('ALTER EXTENSION vectors SET SCHEMA vectors');
    await manager.query('UPDATE pg_catalog.pg_extension SET extrelocatable = false WHERE extname = $1', [extension]);
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

  async tryLock(lock: DatabaseLock): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    return await this.acquireTryLock(lock, queryRunner);
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

  private async acquireTryLock(lock: DatabaseLock, queryRunner: QueryRunner): Promise<boolean> {
    const lockResult = await queryRunner.query('SELECT pg_try_advisory_lock($1)', [lock]);
    return lockResult[0].pg_try_advisory_lock;
  }

  private async releaseLock(lock: DatabaseLock, queryRunner: QueryRunner): Promise<void> {
    return queryRunner.query('SELECT pg_advisory_unlock($1)', [lock]);
  }
}
