import { DataSource } from 'typeorm';
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

export const databaseConfigVector: PostgresConnectionOptions = {
  ...databaseConfig,
  migrationsRun: false,
  migrations: [__dirname + '/migrations/vector/*.{js,ts}'],
};

// this export is used by TypeORM commands in package.json#scripts
export let dataSource = new DataSource(databaseConfig);

export async function runVectorMigrations(): Promise<void> {
  if (!dataSource.isInitialized) {
    dataSource = await dataSource.initialize();
  }
  
  const hasVectorExtension = (await dataSource.query(
    `SELECT * FROM pg_available_extensions WHERE name = 'vectors'`,
  )).length > 0;

  if (hasVectorExtension) {
    const dataSourceVector = await new DataSource(databaseConfigVector).initialize();
    await dataSourceVector.runMigrations();

    await dataSourceVector.query(`SET vectors.enable_prefilter = on`);

    await dataSourceVector.destroy();
  }
}
