import { PostgreSqlContainer } from '@testcontainers/postgresql';

export default async () => {
  if (process.env.DB_HOSTNAME === undefined) {
    const pg = await new PostgreSqlContainer('postgres')
      .withExposedPorts(5432)
      .withDatabase('immich')
      .withUsername('postgres')
      .withPassword('postgres')
      .withReuse()
      .start();

    process.env.DB_URL = pg.getConnectionUri();
  }
  process.env.NODE_ENV = 'development';
  process.env.TYPESENSE_ENABLED = 'false';
  process.env.IMMICH_MACHINE_LEARNING_ENABLED = 'false';
  process.env.IMMICH_TEST_ENV = 'true';
  process.env.DB_HOSTNAME = 'immich-database-test';
  process.env.DB_USERNAME = 'postgres';
  process.env.DB_PASSWORD = 'postgres';
  process.env.DB_DATABASE_NAME = 'e2e_test';
  process.env.UPLOAD_LOCATION = './upload';
  process.env.VITE_SERVER_ENDPOINT = 'http://localhost:2283/api';
  process.env.TZ = 'Z';
};
