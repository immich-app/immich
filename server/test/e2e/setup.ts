import { PostgreSqlContainer } from '@testcontainers/postgresql';
import * as fs from 'fs';
import path from 'path';

export default async () => {
  const allTests: boolean = process.env.IMMICH_RUN_ALL_TESTS === 'true';

  if (!allTests) {
    console.warn(
      `\n\n
      *** Not running all e2e tests. Run 'make test-e2e' to run all tests inside Docker (recommended)\n
      *** or set 'IMMICH_RUN_ALL_TESTS=true' to run all tests(requires dependencies to be installed)\n`,
    );
  }

  let IMMICH_TEST_ASSET_PATH: string = '';

  if (process.env.IMMICH_TEST_ASSET_PATH === undefined) {
    IMMICH_TEST_ASSET_PATH = path.normalize(`${__dirname}/../assets/`);
    process.env.IMMICH_TEST_ASSET_PATH = IMMICH_TEST_ASSET_PATH;
  } else {
    IMMICH_TEST_ASSET_PATH = process.env.IMMICH_TEST_ASSET_PATH;
  }

  const directoryExists = async (dirPath: string) =>
    await fs.promises
      .access(dirPath)
      .then(() => true)
      .catch(() => false);

  if (!(await directoryExists(`${IMMICH_TEST_ASSET_PATH}/albums`))) {
    throw new Error(
      `Test assets not found. Please checkout https://github.com/immich-app/test-assets into ${IMMICH_TEST_ASSET_PATH} before testing`,
    );
  }

  if (process.env.DB_HOSTNAME === undefined) {
    // DB hostname not set which likely means we're not running e2e through docker compose. Start a local postgres container.
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
  process.env.TZ = 'Z';
};
