import { Injectable } from '@nestjs/common';
import AsyncLock from 'async-lock';
import { FileMigrationProvider, Kysely, Migrator, sql, Transaction } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import semver from 'semver';
import {
  EXTENSION_NAMES,
  POSTGRES_VERSION_RANGE,
  VECTOR_EXTENSIONS,
  VECTOR_INDEX_TABLES,
  VECTOR_VERSION_RANGE,
  VECTORCHORD_LIST_SLACK_FACTOR,
  VECTORCHORD_VERSION_RANGE,
  VECTORS_VERSION_RANGE,
} from 'src/constants';
import { DB } from 'src/db';
import { GenerateSql } from 'src/decorators';
import { DatabaseExtension, DatabaseLock, VectorIndex } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { ExtensionVersion, VectorExtension, VectorUpdateResult } from 'src/types';
import { vectorIndexQuery } from 'src/utils/database';
import { isValidInteger } from 'src/validation';
import { DataSource, QueryRunner } from 'typeorm';

export let cachedVectorExtension: VectorExtension | undefined;
export async function getVectorExtension(runner: Kysely<DB> | QueryRunner): Promise<VectorExtension> {
  if (cachedVectorExtension) {
    return cachedVectorExtension;
  }

  cachedVectorExtension = new ConfigRepository().getEnv().database.vectorExtension;
  if (cachedVectorExtension) {
    return cachedVectorExtension;
  }

  let availableExtensions: { name: VectorExtension }[];
  const query = `SELECT name FROM pg_available_extensions WHERE name IN (${VECTOR_EXTENSIONS.map((ext) => `'${ext}'`).join(', ')})`;
  if (runner instanceof Kysely) {
    const { rows } = await sql.raw<{ name: VectorExtension }>(query).execute(runner);
    availableExtensions = rows;
  } else {
    availableExtensions = (await runner.query(query)) as { name: VectorExtension }[];
  }
  const extensionNames = new Set(availableExtensions.map((row) => row.name));
  cachedVectorExtension = VECTOR_EXTENSIONS.find((ext) => extensionNames.has(ext));
  if (!cachedVectorExtension) {
    throw new Error(`No vector extension found. Available extensions: ${VECTOR_EXTENSIONS.join(', ')}`);
  }
  return cachedVectorExtension;
}

export const probes: Record<VectorIndex, number> = {
  [VectorIndex.CLIP]: 1,
  [VectorIndex.FACE]: 1,
};

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
  async getExtensionVersions(extensions: readonly DatabaseExtension[]): Promise<ExtensionVersion[]> {
    const { rows } = await sql<ExtensionVersion>`
      SELECT name, default_version as "availableVersion", installed_version as "installedVersion"
      FROM pg_available_extensions
      WHERE name in (${sql.join(extensions)})
      ORDER BY name DESC
    `.execute(this.db);
    return rows;
  }

  getExtensionVersionRange(extension: VectorExtension): string {
    switch (extension) {
      case DatabaseExtension.VECTORCHORD: {
        return VECTORCHORD_VERSION_RANGE;
      }
      case DatabaseExtension.VECTORS: {
        return VECTORS_VERSION_RANGE;
      }
      case DatabaseExtension.VECTOR: {
        return VECTOR_VERSION_RANGE;
      }
      default: {
        throw new Error(`Unsupported vector extension: '${extension}'`);
      }
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
    this.logger.log(`Creating ${EXTENSION_NAMES[extension]} extension`);
    await sql`CREATE EXTENSION IF NOT EXISTS ${sql.raw(extension)} CASCADE`.execute(this.db);
    if (extension === DatabaseExtension.VECTORCHORD) {
      const dbName = sql.table(await this.getDatabaseName());
      await sql`ALTER DATABASE ${dbName} SET vchordrq.prewarm_dim = '512,640,768,1024,1152,1536'`.execute(this.db);
      await sql`SET vchordrq.prewarm_dim = '512,640,768,1024,1152,1536'`.execute(this.db);
      await sql`ALTER DATABASE ${dbName} SET vchordrq.probes = 1`.execute(this.db);
      await sql`SET vchordrq.probes = 1`.execute(this.db);
    }
  }

  async dropExtension(extension: DatabaseExtension): Promise<void> {
    // extra check for safety
    if (!Object.values(DatabaseExtension).includes(extension)) {
      throw new Error(`Cannot drop extension '${extension}'`);
    }
    await sql`DROP EXTENSION IF EXISTS ${sql.raw(extension)} CASCADE`.execute(this.db);
  }

  async updateVectorExtension(extension: VectorExtension, targetVersion?: string): Promise<VectorUpdateResult> {
    const [{ availableVersion, installedVersion }] = await this.getExtensionVersions([extension]);
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
        await Promise.all([this.reindexVectors(VectorIndex.CLIP), this.reindexVectors(VectorIndex.FACE)]);
      }
    });

    return { restartRequired };
  }

  async prewarm(index: VectorIndex): Promise<void> {
    const vectorExtension = await getVectorExtension(this.db);
    if (vectorExtension !== DatabaseExtension.VECTORCHORD) {
      return;
    }
    this.logger.debug(`Prewarming ${index}`);
    await sql`SELECT vchordrq_prewarm(${index})`.execute(this.db);
  }

  async reindexVectorsIfNeeded(names: VectorIndex[]): Promise<void> {
    const { rows } = await sql<{
      indexdef: string;
      indexname: string;
    }>`SELECT indexdef, indexname FROM pg_indexes WHERE indexname = ANY(ARRAY[${sql.join(names)}])`.execute(this.db);

    const vectorExtension = await getVectorExtension(this.db);

    const promises = [];
    for (const indexName of names) {
      const row = rows.find((index) => index.indexname === indexName);
      const table = VECTOR_INDEX_TABLES[indexName];
      if (!row) {
        promises.push(this.reindexVectors(indexName));
        continue;
      }

      switch (vectorExtension) {
        case DatabaseExtension.VECTOR: {
          if (!row.indexdef.toLowerCase().includes('using hnsw')) {
            promises.push(this.reindexVectors(indexName));
          }
          break;
        }
        case DatabaseExtension.VECTORS: {
          if (!row.indexdef.toLowerCase().includes('using vectors')) {
            promises.push(this.reindexVectors(indexName));
          }
          break;
        }
        case DatabaseExtension.VECTORCHORD: {
          const matches = row.indexdef.match(/(?<=lists = \[)\d+/g);
          const lists = matches && matches.length > 0 ? Number(matches[0]) : 1;
          promises.push(
            this.db
              .selectFrom(this.db.dynamic.table(table).as('t'))
              .select((eb) => eb.fn.countAll<number>().as('count'))
              .executeTakeFirstOrThrow()
              .then(({ count }) => {
                const targetLists = this.targetListCount(count);
                this.logger.log(`targetLists=${targetLists}, current=${lists} for ${indexName} of ${count} rows`);
                if (
                  !row.indexdef.toLowerCase().includes('using vchordrq') ||
                  // slack factor is to avoid frequent reindexing if the count is borderline
                  (lists !== targetLists && lists !== this.targetListCount(count * VECTORCHORD_LIST_SLACK_FACTOR))
                ) {
                  probes[indexName] = this.targetProbeCount(targetLists);
                  return this.reindexVectors(indexName, { lists: targetLists });
                } else {
                  probes[indexName] = this.targetProbeCount(lists);
                }
              }),
          );
          break;
        }
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  private async reindexVectors(indexName: VectorIndex, { lists }: { lists?: number } = {}): Promise<void> {
    this.logger.log(`Reindexing ${indexName}`);
    const table = VECTOR_INDEX_TABLES[indexName];
    const vectorExtension = await getVectorExtension(this.db);
    const { rows } = await sql<{
      columnName: string;
    }>`SELECT column_name as "columnName" FROM information_schema.columns WHERE table_name = ${table}`.execute(this.db);
    if (rows.length === 0) {
      this.logger.warn(
        `Table ${table} does not exist, skipping reindexing. This is only normal if this is a new Immich instance.`,
      );
      return;
    }
    const dimSize = await this.getDimensionSize(table);
    await this.db.transaction().execute(async (tx) => {
      await sql`DROP INDEX IF EXISTS ${sql.raw(indexName)}`.execute(tx);
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
      await sql.raw(vectorIndexQuery({ vectorExtension, table, indexName, lists })).execute(tx);
    });
    this.logger.log(`Reindexed ${indexName}`);
  }

  private async setSearchPath(tx: Transaction<DB>): Promise<void> {
    await sql`SET search_path TO "$user", public, vectors`.execute(tx);
  }

  private async getDatabaseName(): Promise<string> {
    const { rows } = await sql<{ db: string }>`SELECT current_database() as db`.execute(this.db);
    return rows[0].db;
  }

  async getDimensionSize(table: string, column = 'embedding'): Promise<number> {
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

  async setDimensionSize(dimSize: number): Promise<void> {
    if (!isValidInteger(dimSize, { min: 1, max: 2 ** 16 })) {
      throw new Error(`Invalid CLIP dimension size: ${dimSize}`);
    }

    // this is done in two transactions to handle concurrent writes
    await this.db.transaction().execute(async (trx) => {
      await sql`delete from ${sql.table('smart_search')}`.execute(trx);
      await trx.schema.alterTable('smart_search').dropConstraint('dim_size_constraint').ifExists().execute();
      await sql`alter table ${sql.table('smart_search')} add constraint dim_size_constraint check (array_length(embedding::real[], 1) = ${sql.lit(dimSize)})`.execute(
        trx,
      );
    });

    const vectorExtension = await this.getVectorExtension();
    await this.db.transaction().execute(async (trx) => {
      await sql`drop index if exists clip_index`.execute(trx);
      await trx.schema
        .alterTable('smart_search')
        .alterColumn('embedding', (col) => col.setDataType(sql.raw(`vector(${dimSize})`)))
        .execute();
      await sql
        .raw(vectorIndexQuery({ vectorExtension, table: 'smart_search', indexName: VectorIndex.CLIP }))
        .execute(trx);
      await trx.schema.alterTable('smart_search').dropConstraint('dim_size_constraint').ifExists().execute();
    });
    probes[VectorIndex.CLIP] = 1;

    await sql`vacuum analyze ${sql.table('smart_search')}`.execute(this.db);
  }

  async deleteAllSearchEmbeddings(): Promise<void> {
    await sql`truncate ${sql.table('smart_search')}`.execute(this.db);
  }

  private targetListCount(count: number) {
    if (count < 128_000) {
      return 1;
    } else if (count < 2_048_000) {
      return 1 << (32 - Math.clz32(count / 1000));
    } else {
      return 1 << (33 - Math.clz32(Math.sqrt(count)));
    }
  }

  private targetProbeCount(lists: number) {
    return Math.ceil(lists / 8);
  }

  async runMigrations(options?: { transaction?: 'all' | 'none' | 'each' }): Promise<void> {
    const { database } = this.configRepository.getEnv();

    this.logger.log('Running migrations, this may take a while');

    const tableExists = sql<{ result: string | null }>`select to_regclass('migrations') as "result"`;
    const { rows } = await tableExists.execute(this.db);
    const hasTypeOrmMigrations = !!rows[0]?.result;
    if (hasTypeOrmMigrations) {
      // eslint-disable-next-line unicorn/prefer-module
      const dist = resolve(`${__dirname}/..`);

      this.logger.debug('Running typeorm migrations');
      const dataSource = new DataSource({
        type: 'postgres',
        entities: [],
        subscribers: [],
        migrations: [`${dist}/migrations` + '/*.{js,ts}'],
        migrationsRun: false,
        synchronize: false,
        connectTimeoutMS: 10_000, // 10 seconds
        parseInt8: true,
        ...(database.config.connectionType === 'url'
          ? { url: database.config.url }
          : {
              host: database.config.host,
              port: database.config.port,
              username: database.config.username,
              password: database.config.password,
              database: database.config.database,
            }),
      });
      await dataSource.initialize();
      await dataSource.runMigrations(options);
      await dataSource.destroy();
      this.logger.debug('Finished running typeorm migrations');
    }

    this.logger.debug('Running kysely migrations');
    const migrator = new Migrator({
      db: this.db,
      migrationLockTableName: 'kysely_migrations_lock',
      migrationTableName: 'kysely_migrations',
      provider: new FileMigrationProvider({
        fs: { readdir },
        path: { join },
        // eslint-disable-next-line unicorn/prefer-module
        migrationFolder: join(__dirname, '..', 'schema/migrations'),
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
