import { GenericContainer, Wait } from 'testcontainers';
import { DataSource } from 'typeorm';

const globalSetup = async () => {
  const postgres = await new GenericContainer('tensorchord/pgvecto-rs:pg14-v0.2.0')
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

  const postgresPort = postgres.getMappedPort(5432);
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
};

export default globalSetup;
