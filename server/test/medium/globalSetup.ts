import { FileMigrationProvider, Kysely, Migrator } from 'kysely';
import { mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'pg-connection-string';
import { getKyselyConfig } from 'src/utils/database';
import { GenericContainer, Wait } from 'testcontainers';
import { DataSource } from 'typeorm';

const globalSetup = async () => {
  const postgresContainer = await new GenericContainer('tensorchord/pgvecto-rs:pg14-v0.2.0')
    .withExposedPorts(5432)
    .withEnvironment({
      POSTGRES_PASSWORD: 'postgres',
      POSTGRES_USER: 'postgres',
      POSTGRES_DB: 'immich',
    })
    .withCommand([
      'postgres',
      '-c',
      'shared_preload_libraries=vectors.so',
      '-c',
      'search_path="$$user", public, vectors',
      '-c',
      'max_wal_size=2GB',
      '-c',
      'shared_buffers=512MB',
      '-c',
      'fsync=off',
      '-c',
      'full_page_writes=off',
      '-c',
      'synchronous_commit=off',
    ])
    .withWaitStrategy(Wait.forAll([Wait.forLogMessage('database system is ready to accept connections', 2)]))
    .start();

  const postgresPort = postgresContainer.getMappedPort(5432);
  const postgresUrl = `postgres://postgres:postgres@localhost:${postgresPort}/immich`;
  process.env.IMMICH_TEST_POSTGRES_URL = postgresUrl;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const modules = import.meta.glob('/src/migrations/*.ts', { eager: true });

  const config = {
    type: 'postgres' as const,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    migrations: Object.values(modules).map((module) => Object.values(module)[0]),
    migrationsRun: false,
    synchronize: false,
    connectTimeoutMS: 10_000, // 10 seconds
    parseInt8: true,
    url: postgresUrl,
  };

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const dataSource = new DataSource(config);
  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();

  // for whatever reason, importing from test/utils causes vitest to crash
  // eslint-disable-next-line unicorn/prefer-module
  const migrationFolder = join(__dirname, '..', 'schema/migrations');
  // TODO remove after we have at least one kysely migration
  await mkdir(migrationFolder, { recursive: true });

  const parsed = parse(process.env.IMMICH_TEST_POSTGRES_URL!);

  const parsedOptions = {
    ...parsed,
    ssl: false,
    host: parsed.host ?? undefined,
    port: parsed.port ? Number(parsed.port) : undefined,
    database: parsed.database ?? undefined,
  };

  const db = new Kysely(getKyselyConfig(parsedOptions));

  // TODO just call `databaseRepository.migrate()` (probably have to wait until TypeOrm is gone)
  const migrator = new Migrator({
    db,
    migrationLockTableName: 'kysely_migrations_lock',
    migrationTableName: 'kysely_migrations',
    provider: new FileMigrationProvider({
      fs: { readdir },
      path: { join },
      migrationFolder,
    }),
  });

  const { error } = await migrator.migrateToLatest();
  if (error) {
    console.error('Unable to run kysely migrations', error);
    throw error;
  }

  await db.destroy();
};

export default globalSetup;
