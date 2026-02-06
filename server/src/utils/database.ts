import { KyselyConfig, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { DatabaseConnectionParams } from 'src/types';

export function getKyselyConfig(config: DatabaseConnectionParams): KyselyConfig {
  const connectionString =
    config.connectionType === 'url'
      ? config.url
      : `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;

  return {
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString }),
    }),
  };
}
