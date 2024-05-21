import { Logger } from '@nestjs/common';
import { TlsOptions } from 'node:tls';
import { DatabaseExtension } from 'src/interfaces/database.interface';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';

const url = process.env.DB_URL;
const urlOrParts = url
  ? { url }
  : {
      host: process.env.DB_HOSTNAME || 'database',
      port: Number.parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE_NAME || 'immich',
    };

// Database TLS
const ssl: TlsOptions = {
  rejectUnauthorized: process.env.DB_TLS_SKIP_VERIFY !== 'true',
};
if (process.env.DB_TLS_CA) {
  ssl.ca = process.env.DB_TLS_CA.split(String.raw`\n`).join('\n');
}
if (process.env.DB_TLS_SERVERNAME) {
  //@ts-expect-error ConnectionOptions for clients in node:tls actually contain this property
  // It will be used to handle some cases where the server credentials do not match the
  // actual connection address used by the client
  ssl.servername = process.env.DB_TLS_SERVERNAME;
}
if (process.env.DB_TLS_CLIENT_CERT && process.env.DB_TLS_CLIENT_KEY) {
  ssl.cert = process.env.DB_TLS_CLIENT_CERT.split(String.raw`\n`).join('\n');
  ssl.key = process.env.DB_TLS_CLIENT_KEY.split(String.raw`\n`).join('\n');
}

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
  ssl: process.env.DB_TLS === 'true' ? ssl : false,
};
new Logger('DatabaseConfig').log(
  `Database TLS is ${process.env.DB_TLS === 'true' ? 'enable' : 'disable'}; ${process.env.DB_TLS_SKIP_VERIFY === 'true' ? 'Skip TLS verify; ' : ''}${process.env.DB_TLS_CA ? 'Custom CA is set; ' : ''}${ssl.cert && ssl.key ? 'mTLS is enable' : ''}`,
);

/**
 * @deprecated - DO NOT USE THIS
 *
 * this export is ONLY to be used for TypeORM commands in package.json#scripts
 */
export const dataSource = new DataSource({ ...databaseConfig, host: 'localhost' });

export const getVectorExtension = () =>
  process.env.DB_VECTOR_EXTENSION === 'pgvector' ? DatabaseExtension.VECTOR : DatabaseExtension.VECTORS;
