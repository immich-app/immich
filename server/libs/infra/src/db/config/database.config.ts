import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { DataSource } from 'typeorm';

const baseDatabaseConfig: PostgresConnectionOptions = {
  type: 'postgres',
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  synchronize: false,
  migrations: [__dirname + '/../migrations/*.{js,ts}'],
  migrationsRun: true,
  connectTimeoutMS: 10000, // 10 seconds
};

const envBasedDatabaseConfig = {
  host: process.env.DB_HOSTNAME || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE_NAME || 'immich',
};

const url = process.env.DB_URL;
const additionalSSLDatabaseConfig = url ? { url } : envBasedDatabaseConfig;

export const databaseConfig: PostgresConnectionOptions = { ...baseDatabaseConfig, ...additionalSSLDatabaseConfig };

export const dataSource = new DataSource(databaseConfig);
