import { TLSSocketOptions, TlsOptions, rootCertificates } from 'node:tls';
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
const enableTLS = process.env.DB_TLS === 'true';
const ssl: TlsOptions = {
  rejectUnauthorized: process.env.DB_TLS_SKIP_VERIFY !== 'true',
};
if (process.env.DB_TLS_CA) {
  ssl.ca = [...rootCertificates, process.env.DB_TLS_CA];
}
if (process.env.DB_TLS_SERVERNAME) {
  //@ts-expect-error ConnectionOptions for clients in node:tls actuallycontainthis property
  // It will be used to handle some cases where the server credentials do not match the
  // actual connection address used by the client
  ssl.servername = process.env.DB_TLS_SERVERNAME;
}
if (process.env.DB_TLS_CLIENT_CERT && process.env.DB_TLS_CLIENT_KEY) {
  ssl.cert = process.env.DB_TLS_CLIENT_CERT;
  ssl.key = process.env.DB_TLS_CLIENT_KEY;
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
  ssl: enableTLS ? ssl : false,
};

/**
 * @deprecated - DO NOT USE THIS
 *
 * this export is ONLY to be used for TypeORM commands in package.json#scripts
 */
export const dataSource = new DataSource({ ...databaseConfig, host: 'localhost' });

export const vectorExt =
  process.env.DB_VECTOR_EXTENSION === 'pgvector' ? DatabaseExtension.VECTOR : DatabaseExtension.VECTORS;
