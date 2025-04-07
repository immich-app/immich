import { Injectable } from '@nestjs/common';
import AsyncLock from 'async-lock';
import { FileMigrationProvider, Kysely, Migrator, sql, Transaction } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import semver from 'semver';
import {
  EXTENSION_NAMES,
  POSTGRES_VERSION_RANGE,
  VECTOR_EXTENSIONS,
  VECTOR_VERSION_RANGE,
  VECTORCHORD_VERSION_RANGE,
  VECTORS_VERSION_RANGE,
} from 'src/constants';
import { DB } from 'src/db';
import { GenerateSql } from 'src/decorators';
import { DatabaseExtension, DatabaseLock, VectorIndex } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { ExtensionVersion, VectorExtension, VectorUpdateResult } from 'src/types';
import { isValidInteger } from 'src/validation';
import { DataSource, QueryRunner } from 'typeorm';

export function createVectorIndex(vectorExtension: VectorExtension, tableName: string, indexName: string): string {
  switch (vectorExtension) {
    case DatabaseExtension.VECTORCHORD:
      return `
        CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName} USING vchordrq (embedding vector_cosine_ops) WITH (options = $$
        residual_quantization = false
        [build.internal]
        lists = [1000]
        spherical_centroids = true
        $$)`;
    case DatabaseExtension.VECTORS:
      return `
        CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName} USING vectors (embedding vector_cos_ops) WITH (options = $$
        [indexing.hnsw]
        m = 16
        ef_construction = 300
        $$)`;
    case DatabaseExtension.VECTOR:
      return `
        CREATE INDEX IF NOT EXISTS ${indexName}
        ON ${tableName}
        USING hnsw (embedding vector_cosine_ops)`;
    default:
      throw new Error(`Unsupported vector extension: '${vectorExtension}'`);
  }
}

let cachedVectorExtension: VectorExtension | undefined;
export async function getVectorExtension(runner: Kysely<DB> | QueryRunner): Promise<VectorExtension> {
  if (cachedVectorExtension) {
    return cachedVectorExtension;
  }

  cachedVectorExtension = new ConfigRepository().getEnv().database.vectorExtension;
  if (!cachedVectorExtension) {
    let availableExtensions: { name: VectorExtension }[];
    const query = `SELECT name FROM pg_available_extensions WHERE name IN (${VECTOR_EXTENSIONS.map((ext) => `'${ext}'`).join(', ')})`;
    if (runner instanceof Kysely) {
      const { rows } = await sql.raw<{ name: VectorExtension }>(query).execute(runner);
      availableExtensions = rows;
    } else {
      availableExtensions = (await runner.query(query)) as { name: VectorExtension }[];
    }
    const extensionNames = availableExtensions.map((row) => row.name);
    cachedVectorExtension = VECTOR_EXTENSIONS.find((ext) => extensionNames.includes(ext));
  }
  if (!cachedVectorExtension) {
    throw new Error(`No vector extension found. Available extensions: ${VECTOR_EXTENSIONS.join(', ')}`);
  }
  return cachedVectorExtension;
}

@Injectable()
export class DatabaseRepository {
  private readonly asyncLock = new AsyncLock();

  constructor(
    @InjectKysely() private db: Kysely<DB>,
    private logger: LoggingRepository,
    private configRepository: ConfigRepository,
  ) {
    this.logger.setContext(DatabaseRepository.name);
  }

  async shutdown() {
    await this.db.destroy();
  }

  getVectorExtension(): Promise<VectorExtension> {
    return getVectorExtension(this.db);
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
    switch (extension) {
      case DatabaseExtension.VECTORCHORD:
        return VECTORCHORD_VERSION_RANGE;
      case DatabaseExtension.VECTORS:
        return VECTORS_VERSION_RANGE;
      case DatabaseExtension.VECTOR:
        return VECTOR_VERSION_RANGE;
      default:
        throw new Error(`Unsupported vector extension: '${extension}'`);
    }
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
    await sql`CREATE EXTENSION IF NOT EXISTS ${sql.raw(extension)} CASCADE`.execute(this.db);
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

      await sql`ALTER EXTENSION ${sql.raw(extension)} UPDATE TO ${sql.lit(targetVersion)}`.execute(tx);

      const diff = semver.diff(installedVersion, targetVersion);
      if (isVectors && (diff === 'major' || diff === 'minor')) {
        await sql`SELECT pgvectors_upgrade()`.execute(tx);
        restartRequired = true;
      } else if (diff) {
        await Promise.all([this.reindex(VectorIndex.CLIP), this.reindex(VectorIndex.FACE)]);
      }
    });

    return { restartRequired };
  }

  async reindex(index: VectorIndex): Promise<void> {
    this.logger.log(`Reindexing ${index}`);
    const vectorExtension = await getVectorExtension(this.db);
    const tables = {
      [VectorIndex.CLIP]: 'smart_search',
      [VectorIndex.FACE]: 'face_search',
    };
    const table = tables[index];
    const { rows } = await sql<{
      columnName: string;
    }>`SELECT column_name as "columnName" FROM information_schema.columns WHERE table_name = ${table}`.execute(this.db);
    if (rows.length === 0) {
      this.logger.warn(
        `Table ${table} does not exist, skipping reindexing. This is only normal if this is a new Immich instance.`,
      );
      return;
    }
    const dimSize = await this.getDimSize(table);
    await this.db.transaction().execute(async (tx) => {
      await sql`DROP INDEX IF EXISTS ${sql.raw(index)}`.execute(this.db);
      if (!rows.some((row) => row.columnName === 'embedding')) {
        this.logger.warn(`Column 'embedding' does not exist in table '${table}', truncating and adding column.`);
        await sql`TRUNCATE TABLE ${sql.raw(table)}`.execute(tx);
        await sql`ALTER TABLE ${sql.raw(table)} ADD COLUMN embedding real[] NOT NULL`.execute(tx);
      }
      await sql`ALTER TABLE ${sql.raw(table)} ALTER COLUMN embedding SET DATA TYPE real[]`.execute(tx);
      const schema = vectorExtension === DatabaseExtension.VECTORS ? 'vectors.' : '';
      await sql`
        ALTER TABLE ${sql.raw(table)}
        ALTER COLUMN embedding
        SET DATA TYPE ${sql.raw(schema)}vector(${sql.raw(String(dimSize))})`.execute(tx);
      await sql.raw(createVectorIndex(vectorExtension, table, index)).execute(tx);
    });
  }

  @GenerateSql({ params: [VectorIndex.CLIP] })
  async shouldReindex(names: VectorIndex[]): Promise<boolean[]> {
    const { rows } = await sql<{
      indexdef: string;
      indexname: string;
    }>`SELECT indexdef, indexname FROM pg_indexes WHERE indexname = ANY(ARRAY[${sql.join(names)}])`.execute(this.db);

    let keyword: string;
    switch (await getVectorExtension(this.db)) {
      case DatabaseExtension.VECTOR:
        keyword = 'using hnsw';
        break;
      case DatabaseExtension.VECTORCHORD:
        keyword = 'using vchordrq';
        break;
      case DatabaseExtension.VECTORS:
        keyword = 'using vectors';
        break;
    }

    return names.map(
      (name) =>
        !rows
          .find((index) => index.indexname === name)
          ?.indexdef.toLowerCase()
          .includes(keyword),
    );
  }

  private async setSearchPath(tx: Transaction<DB>): Promise<void> {
    await sql`SET search_path TO "$user", public, vectors`.execute(tx);
  }

  private async getDimSize(table: string, column = 'embedding'): Promise<number> {
    const { rows } = await sql<{ dimsize: number }>`
      SELECT atttypmod as dimsize
      FROM pg_attribute f
        JOIN pg_class c ON c.oid = f.attrelid
      WHERE c.relkind = 'r'::char
        AND f.attnum > 0
        AND c.relname = ${table}::text
        AND f.attname = ${column}::text
    `.execute(this.db);

    const dimSize = rows[0]?.dimsize;
    if (!isValidInteger(dimSize, { min: 1, max: 2 ** 16 })) {
      this.logger.warn(`Could not retrieve dimension size of column '${column}' in table '${table}', assuming 512`);
      return 512;
    }
    return dimSize;
  }

  async runMigrations(options?: { transaction?: 'all' | 'none' | 'each'; only?: 'kysely' | 'typeorm' }): Promise<void> {
    const { database } = this.configRepository.getEnv();
    if (options?.only !== 'kysely') {
      const dataSource = new DataSource(database.config.typeorm);

      this.logger.log('Running migrations, this may take a while');

      this.logger.debug('Running typeorm migrations');

      await dataSource.initialize();
      await dataSource.runMigrations(options);
      await dataSource.destroy();

      this.logger.debug('Finished running typeorm migrations');
    }

    if (options?.only !== 'typeorm') {
      // eslint-disable-next-line unicorn/prefer-module
      const migrationFolder = join(__dirname, '..', 'schema/migrations');

      // TODO remove after we have at least one kysely migration
      if (!existsSync(migrationFolder)) {
        return;
      }

      this.logger.debug('Running kysely migrations');
      const migrator = new Migrator({
        db: this.db,
        migrationLockTableName: 'kysely_migrations_lock',
        migrationTableName: 'kysely_migrations',
        provider: new FileMigrationProvider({
          fs: { readdir },
          path: { join },
          migrationFolder,
        }),
      });

      const { error, results } = await migrator.migrateToLatest();

      for (const result of results ?? []) {
        if (result.status === 'Success') {
          this.logger.log(`Migration "${result.migrationName}" succeeded`);
        }

        if (result.status === 'Error') {
          this.logger.warn(`Migration "${result.migrationName}" failed`);
        }
      }

      if (error) {
        this.logger.error(`Kysely migrations failed: ${error}`);
        throw error;
      }

      this.logger.debug('Finished running kysely migrations');
    }
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
