import { Injectable } from '@nestjs/common';
import AsyncLock from 'async-lock';
import { Kysely, sql, Transaction } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import semver from 'semver';
import { EXTENSION_NAMES, POSTGRES_VERSION_RANGE, VECTOR_VERSION_RANGE, VECTORS_VERSION_RANGE } from 'src/constants';
import { DB } from 'src/db';
import { GenerateSql } from 'src/decorators';
import { DatabaseExtension, DatabaseLock, VectorIndex } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { ExtensionVersion, VectorExtension, VectorUpdateResult } from 'src/types';
import { isValidInteger } from 'src/validation';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseRepository {
  private vectorExtension: VectorExtension;
  private readonly asyncLock = new AsyncLock();

  constructor(
    @InjectKysely() private db: Kysely<DB>,
    private logger: LoggingRepository,
    private configRepository: ConfigRepository,
  ) {
    this.vectorExtension = configRepository.getEnv().database.vectorExtension;
    this.logger.setContext(DatabaseRepository.name);
  }

  async shutdown() {
    await this.db.destroy();
  }

  @GenerateSql({ params: [DatabaseExtension.VECTORS] })
  async getExtensionVersion(extension: DatabaseExtension): Promise<ExtensionVersion> {
    const { rows } = await sql<ExtensionVersion>`
      SELECT default_version as "availableVersion", installed_version as "installedVersion"
      FROM pg_available_extensions
      WHERE name = ${extension}
    `.execute(this.db);
    return rows[0] ?? { availableVersion: null, installedVersion: null };
  }

  getExtensionVersionRange(extension: VectorExtension): string {
    return extension === DatabaseExtension.VECTORS ? VECTORS_VERSION_RANGE : VECTOR_VERSION_RANGE;
  }

  @GenerateSql()
  async getPostgresVersion(): Promise<string> {
    const { rows } = await sql<{ server_version: string }>`SHOW server_version`.execute(this.db);
    return rows[0].server_version;
  }

  getPostgresVersionRange(): string {
    return POSTGRES_VERSION_RANGE;
  }

  async createExtension(extension: DatabaseExtension): Promise<void> {
    await sql`CREATE EXTENSION IF NOT EXISTS ${sql.raw(extension)}`.execute(this.db);
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
    await this.db.transaction().execute(async (tx) => {
      await this.setSearchPath(tx);

      if (isVectors && installedVersion === '0.1.1') {
        await this.setExtVersion(tx, DatabaseExtension.VECTORS, '0.1.11');
      }

      const isSchemaUpgrade = semver.satisfies(installedVersion, '0.1.1 || 0.1.11');
      if (isSchemaUpgrade && isVectors) {
        await this.updateVectorsSchema(tx);
      }

      await sql`ALTER EXTENSION ${sql.raw(extension)} UPDATE TO ${sql.lit(targetVersion)}`.execute(tx);

      const diff = semver.diff(installedVersion, targetVersion);
      if (isVectors && diff && ['minor', 'major'].includes(diff)) {
        await sql`SELECT pgvectors_upgrade()`.execute(tx);
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
      await sql`REINDEX INDEX ${sql.raw(index)}`.execute(this.db);
    } catch (error) {
      if (this.vectorExtension !== DatabaseExtension.VECTORS) {
        throw error;
      }
      this.logger.warn(`Could not reindex index ${index}. Attempting to auto-fix.`);

      const table = await this.getIndexTable(index);
      const dimSize = await this.getDimSize(table);
      await this.db.transaction().execute(async (tx) => {
        await this.setSearchPath(tx);
        await sql`DROP INDEX IF EXISTS ${sql.raw(index)}`.execute(tx);
        await sql`ALTER TABLE ${sql.raw(table)} ALTER COLUMN embedding SET DATA TYPE real[]`.execute(tx);
        await sql`ALTER TABLE ${sql.raw(table)} ALTER COLUMN embedding SET DATA TYPE vector(${sql.raw(String(dimSize))})`.execute(
          tx,
        );
        await sql`SET vectors.pgvector_compatibility=on`.execute(tx);
        await sql`
          CREATE INDEX IF NOT EXISTS ${sql.raw(index)} ON ${sql.raw(table)}
          USING hnsw (embedding vector_cosine_ops)
          WITH (ef_construction = 300, m = 16)
        `.execute(tx);
      });
    }
  }

  @GenerateSql({ params: [VectorIndex.CLIP] })
  async shouldReindex(name: VectorIndex): Promise<boolean> {
    if (this.vectorExtension !== DatabaseExtension.VECTORS) {
      return false;
    }

    try {
      const { rows } = await sql<{
        idx_status: string;
      }>`SELECT idx_status FROM pg_vector_index_stat WHERE indexname = ${name}`.execute(this.db);
      return rows[0]?.idx_status === 'UPGRADE';
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

  private async setSearchPath(tx: Transaction<DB>): Promise<void> {
    await sql`SET search_path TO "$user", public, vectors`.execute(tx);
  }

  private async setExtVersion(tx: Transaction<DB>, extName: DatabaseExtension, version: string): Promise<void> {
    await sql`UPDATE pg_catalog.pg_extension SET extversion = ${version} WHERE extname = ${extName}`.execute(tx);
  }

  private async getIndexTable(index: VectorIndex): Promise<string> {
    const { rows } = await sql<{
      relname: string | null;
    }>`SELECT relname FROM pg_stat_all_indexes WHERE indexrelname = ${index}`.execute(this.db);
    const table = rows[0]?.relname;
    if (!table) {
      throw new Error(`Could not find table for index ${index}`);
    }
    return table;
  }

  private async updateVectorsSchema(tx: Transaction<DB>): Promise<void> {
    const extension = DatabaseExtension.VECTORS;
    await sql`CREATE SCHEMA IF NOT EXISTS ${extension}`.execute(tx);
    await sql`UPDATE pg_catalog.pg_extension SET extrelocatable = true WHERE extname = ${extension}`.execute(tx);
    await sql`ALTER EXTENSION vectors SET SCHEMA vectors`.execute(tx);
    await sql`UPDATE pg_catalog.pg_extension SET extrelocatable = false WHERE extname = ${extension}`.execute(tx);
  }

  private async getDimSize(table: string, column = 'embedding'): Promise<number> {
    const { rows } = await sql<{ dimsize: number }>`
      SELECT atttypmod as dimsize
      FROM pg_attribute f
        JOIN pg_class c ON c.oid = f.attrelid
      WHERE c.relkind = 'r'::char
        AND f.attnum > 0
        AND c.relname = ${table}
        AND f.attname = '${column}'
    `.execute(this.db);

    const dimSize = rows[0]?.dimsize;
    if (!isValidInteger(dimSize, { min: 1, max: 2 ** 16 })) {
      throw new Error(`Could not retrieve dimension size`);
    }
    return dimSize;
  }

  async runMigrations(options?: { transaction?: 'all' | 'none' | 'each' }): Promise<void> {
    const { database } = this.configRepository.getEnv();
    const dataSource = new DataSource(database.config.typeorm);

    this.logger.log('Running migrations, this may take a while');

    await dataSource.initialize();
    await dataSource.runMigrations(options);
    await dataSource.destroy();
  }

  async withLock<R>(lock: DatabaseLock, callback: () => Promise<R>): Promise<R> {
    let res;
    await this.asyncLock.acquire(DatabaseLock[lock], async () => {
      await this.db.connection().execute(async (connection) => {
        try {
          await this.acquireLock(lock, connection);
          res = await callback();
        } finally {
          await this.releaseLock(lock, connection);
        }
      });
    });

    return res as R;
  }

  tryLock(lock: DatabaseLock): Promise<boolean> {
    return this.db.connection().execute(async (connection) => this.acquireTryLock(lock, connection));
  }

  isBusy(lock: DatabaseLock): boolean {
    return this.asyncLock.isBusy(DatabaseLock[lock]);
  }

  async wait(lock: DatabaseLock): Promise<void> {
    await this.asyncLock.acquire(DatabaseLock[lock], () => {});
  }

  private async acquireLock(lock: DatabaseLock, connection: Kysely<DB>): Promise<void> {
    await sql`SELECT pg_advisory_lock(${lock})`.execute(connection);
  }

  private async acquireTryLock(lock: DatabaseLock, connection: Kysely<DB>): Promise<boolean> {
    const { rows } = await sql<{
      pg_try_advisory_lock: boolean;
    }>`SELECT pg_try_advisory_lock(${lock})`.execute(connection);
    return rows[0].pg_try_advisory_lock;
  }

  private async releaseLock(lock: DatabaseLock, connection: Kysely<DB>): Promise<void> {
    await sql`SELECT pg_advisory_unlock(${lock})`.execute(connection);
  }
}
