import { PostgreSqlContainer } from '@testcontainers/postgresql';
import * as fs from 'fs';
import path from 'path';

export default async () => {
  const allTests: boolean = process.env.ALL_TESTS === 'true';

  if (!allTests) {
    console.warn(
      "\n\n *** Not running all e2e tests. Set 'ALL_TESTS=true' to run all tests (requires dependencies to be installed) ***",
    );
  }

  let TEST_ASSET_PATH: string = '';

  if (process.env.TEST_ASSET_PATH === undefined) {
    TEST_ASSET_PATH = path.normalize(`${__dirname}/../assets/`);
    process.env.TEST_ASSET_PATH = TEST_ASSET_PATH;
  } else {
    TEST_ASSET_PATH = process.env.TEST_ASSET_PATH;
  }

  const directoryExists = async (dirPath: string) =>
    await fs.promises
      .access(dirPath)
      .then(() => true)
      .catch(() => false);

  if (!(await directoryExists(`${TEST_ASSET_PATH}/albums`))) {
    throw new Error(
      `Test assets not found. Please checkout https://github.com/immich-app/test-assets into ${TEST_ASSET_PATH} before testing`,
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
