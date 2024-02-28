import { PostgreSqlContainer } from '@testcontainers/postgresql';
import path from 'node:path';

export default async () => {
  let IMMICH_TEST_ASSET_PATH: string = '';

  if (process.env.IMMICH_TEST_ASSET_PATH === undefined) {
    IMMICH_TEST_ASSET_PATH = path.normalize(`${__dirname}/../../test/assets/`);
    process.env.IMMICH_TEST_ASSET_PATH = IMMICH_TEST_ASSET_PATH;
  } else {
    IMMICH_TEST_ASSET_PATH = process.env.IMMICH_TEST_ASSET_PATH;
  }

  const pg = await new PostgreSqlContainer('tensorchord/pgvecto-rs:pg14-v0.2.0')
    .withDatabase('immich')
    .withUsername('postgres')
    .withPassword('postgres')
    .withReuse()
    .withCommand(['-c', 'fsync=off', '-c', 'shared_preload_libraries=vectors.so'])
    .start();

  process.env.DB_URL = pg.getConnectionUri();
  process.env.NODE_ENV = 'development';
  process.env.TZ = 'Z';

  if (process.env.LOG_LEVEL === undefined) {
    process.env.LOG_LEVEL = 'fatal';
  }
};
