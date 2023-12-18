import { DataSource, QueryRunner } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

const url = process.env.DB_URL;
const urlOrParts = url
  ? { url }
  : {
      host: process.env.DB_HOSTNAME || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE_NAME || 'immich',
    };

export const databaseConfig: PostgresConnectionOptions = {
  type: 'postgres',
  entities: [__dirname + '/entities/*.entity.{js,ts}'],
  synchronize: false,
  migrations: [__dirname + '/migrations/*.{js,ts}'],
  subscribers: [__dirname + '/subscribers/*.{js,ts}'],
  migrationsRun: true,
  connectTimeoutMS: 10000, // 10 seconds
  ...urlOrParts,
};

// this export is used by TypeORM commands in package.json#scripts
export const dataSource = new DataSource(databaseConfig);

export async function databaseChecks() {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  await assertVectors(dataSource);
  await enablePrefilter(dataSource);
  await dataSource.runMigrations();
}

export async function enablePrefilter(runner: DataSource | QueryRunner) {
  await runner.query(`SET vectors.enable_prefilter = on`);
}

export async function getExtensionVersion(extName: string, runner: DataSource | QueryRunner): Promise<string | null> {
  const res = await runner.query(`SELECT extversion FROM pg_extension WHERE extname = $1`, [extName]);
  return res[0]?.['extversion'] ?? null;
}

export async function getPostgresVersion(runner: DataSource | QueryRunner): Promise<string> {
  const res = await runner.query(`SHOW server_version`);
  return res[0]['server_version'].split('.')[0];
}

export async function assertVectors(runner: DataSource | QueryRunner) {
  const postgresVersion = await getPostgresVersion(runner);
  const expected = ['0.1.1', '0.1.11'];
  const image = `tensorchord/pgvecto-rs:pg${postgresVersion}-v${expected[expected.length - 1]}`;

  await runner.query('CREATE EXTENSION IF NOT EXISTS vectors').catch((err) => {
    console.error(
      'Failed to create pgvecto.rs extension. ' +
        `If you have not updated your Postgres instance to an image that supports pgvecto.rs (such as '${image}'), please do so. ` +
        'See the v1.91.0 release notes for more info: https://github.com/immich-app/immich/releases/tag/v1.91.0',
    );
    throw err;
  });

  const version = await getExtensionVersion('vectors', runner);
  if (version != null && !expected.includes(version)) {
    throw new Error(
      `The pgvecto.rs extension version is ${version} instead of the expected version ${
        expected[expected.length - 1]
      }.` + `If you're using the 'latest' tag, please switch to '${image}'.`,
    );
  }
}
