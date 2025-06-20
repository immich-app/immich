import { Kysely } from 'kysely';
import { DB } from 'src/db';
import { ConfigRepository } from 'src/repositories/config.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { getKyselyConfig } from 'src/utils/database';
import { GenericContainer, Wait } from 'testcontainers';

const globalSetup = async () => {
  const postgresContainer = await new GenericContainer('ghcr.io/immich-app/postgres:14-vectorchord0.4.3')
    .withExposedPorts(5432)
    .withEnvironment({
      POSTGRES_PASSWORD: 'postgres',
      POSTGRES_USER: 'postgres',
      POSTGRES_DB: 'dbname',
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
  const postgresUrl = `postgres://postgres:postgres@localhost:${postgresPort}/dbname`;

  process.env.IMMICH_TEST_POSTGRES_URL = postgresUrl;

  const db = new Kysely<DB>(getKyselyConfig({ connectionType: 'url', url: postgresUrl }));

  const configRepository = new ConfigRepository();
  const logger = LoggingRepository.create();
  await new DatabaseRepository(db, logger, configRepository).runMigrations();

  await db.destroy();
};

export default globalSetup;
