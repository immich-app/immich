import { Kysely } from 'kysely';
import { PostgresJSDialect } from 'kysely-postgres-js';
import { Sql } from 'postgres';
import { readers } from 'src/sql-tools/readers';
import { DatabaseSchema, PostgresDB, SchemaFromDatabaseOptions } from 'src/sql-tools/types';

/**
 * Load schema from a database url
 */
export const schemaFromDatabase = async (
  postgres: Sql,
  options: SchemaFromDatabaseOptions = {},
): Promise<DatabaseSchema> => {
  const schema: DatabaseSchema = {
    databaseName: 'immich',
    schemaName: options.schemaName || 'public',
    parameters: [],
    functions: [],
    enums: [],
    extensions: [],
    tables: [],
    warnings: [],
  };

  const db = new Kysely<PostgresDB>({ dialect: new PostgresJSDialect({ postgres }) });
  for (const reader of readers) {
    await reader(schema, db);
  }

  await db.destroy();

  return schema;
};
