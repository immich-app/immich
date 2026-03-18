import { Migrator } from '@immich/sql-tools';
import { join } from 'node:path';
import { GenericContainer, Wait } from 'testcontainers';

const globalSetup = async () => {
  const templateName = 'mich';
  const postgresContainer = await new GenericContainer('ghcr.io/immich-app/postgres:14-vectorchord0.4.3')
    .withExposedPorts(5432)
    .withEnvironment({
      POSTGRES_PASSWORD: 'postgres',
      POSTGRES_USER: 'postgres',
      POSTGRES_DB: templateName,
    })
    .withCommand([
      'postgres',
      '-c',
      'shared_preload_libraries=vchord.so',
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
      '-c',
      'config_file=/var/lib/postgresql/data/postgresql.conf',
    ])
    .withWaitStrategy(Wait.forAll([Wait.forLogMessage('database system is ready to accept connections', 2)]))
    .start();

  const postgresPort = postgresContainer.getMappedPort(5432);
  const postgresUrl = `postgres://postgres:postgres@localhost:${postgresPort}/${templateName}`;

  process.env.IMMICH_TEST_POSTGRES_URL = postgresUrl;

  const migrator = new Migrator({
    allowUnorderedMigrations: false,
    connectionParams: { connectionType: 'url', url: postgresUrl },
    // eslint-disable-next-line unicorn/prefer-module
    migrationFolder: join(__dirname, '../../src/schema/migrations'),
  });
  await migrator.runMigrations();

  await migrator.destroy();
};

export default globalSetup;
