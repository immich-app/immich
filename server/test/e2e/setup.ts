import { PostgreSqlContainer } from '@testcontainers/postgresql';
export default async () => {
  const pg = await new PostgreSqlContainer('postgres')
    .withExposedPorts(5432)
    .withDatabase('immich')
    .withUsername('postgres')
    .withPassword('postgres')
    .withReuse()
    .start();

  process.env.NODE_ENV = 'development';
  process.env.TYPESENSE_ENABLED = 'false';
  process.env.IMMICH_MACHINE_LEARNING_ENABLED = 'false';
  process.env.IMMICH_TEST_ENV = 'true';
  process.env.DB_URL = pg.getConnectionUri();
  process.env.TZ = 'Z';
};
