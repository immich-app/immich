import { PostgreSqlContainer } from '@testcontainers/postgresql';

export default async () => {
  const pg = await new PostgreSqlContainer('tensorchord/pgvecto-rs:pg14-v0.2.0')
    .withDatabase('immich')
    .withUsername('postgres')
    .withPassword('postgres')
    .withReuse()
    .withCommand(['-c', 'fsync=off', '-c', 'shared_preload_libraries=vectors.so'])
    .start();

  process.env.DB_URL = pg.getConnectionUri();
  process.env.NODE_ENV = 'development';
  process.env.LOG_LEVEL = 'fatal';
  process.env.TZ = 'Z';
};
