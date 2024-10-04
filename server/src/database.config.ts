import { ConfigRepository } from 'src/repositories/config.repository';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';

const { database } = new ConfigRepository().getEnv();
const { url, host, port, username, password, name } = database;
const urlOrParts = url
  ? { url }
  : {
      host,
      port,
      username,
      password,
      database: name,
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
  ...urlOrParts,
};

/**
 * @deprecated - DO NOT USE THIS
 *
 * this export is ONLY to be used for TypeORM commands in package.json#scripts
 */
export const dataSource = new DataSource({ ...databaseConfig, host: 'localhost' });
