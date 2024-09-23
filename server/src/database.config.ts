import { PostgresJSDialect } from 'kysely-postgres-js';
import postgres from 'postgres';
import { DatabaseExtension } from 'src/interfaces/database.interface';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';

const url = process.env.DB_URL;
const parts = {
  host: process.env.DB_HOSTNAME || 'database',
  port: Number.parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE_NAME || 'immich',
};

/* eslint unicorn/prefer-module: "off" -- We can fix this when migrating to ESM*/
export const databaseConfig: PostgresConnectionOptions = {
  type: 'postgres',
  entities: [__dirname + '/entities/*.entity.{js,ts}'],
  migrations: [__dirname + '/migrations/*.{js,ts}'],
  subscribers: [__dirname + '/subscribers/*.{js,ts}'],
  migrationsRun: false,
  synchronize: false,
  connectTimeoutMS: 10_000, // 10 seconds
  parseInt8: true,
  ...(url ? { url } : parts),
};

const driverOptions = {
  max: 10,
  types: {
    date: {
      to: 1184,
      from: [1082, 1114, 1184],
      serialize: (x: Date | string) => (x instanceof Date ? x.toISOString() : x),
      parse: (x: string) => new Date(x),
    },
    bigint: {
      to: 20,
      from: [20],
      parse: (value: string) => Number.parseInt(value),
      serialize: (value: number) => value.toString(),
    },
  },
};
const dialect = new PostgresJSDialect({
  postgres: url ? postgres(url, driverOptions) : postgres({ ...parts, ...driverOptions }),
});
export const kyselyConfig = { dialect, log: ['error'] as const };

/**
 * @deprecated - DO NOT USE THIS
 *
 * this export is ONLY to be used for TypeORM commands in package.json#scripts
 */
export const dataSource = new DataSource({ ...databaseConfig, host: 'localhost' });

export const getVectorExtension = () =>
  process.env.DB_VECTOR_EXTENSION === 'pgvector' ? DatabaseExtension.VECTOR : DatabaseExtension.VECTORS;
