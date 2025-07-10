import { Kysely } from 'kysely';
import { PostgresJSDialect } from 'kysely-postgres-js';
import { Sql } from 'postgres';
import { ReaderContext } from 'src/sql-tools/contexts/reader-context';
import { readers } from 'src/sql-tools/readers';
import { DatabaseSchema, PostgresDB, SchemaFromDatabaseOptions } from 'src/sql-tools/types';

/**
 * Load schema from a database url
 */
export const schemaFromDatabase = async (
  postgres: Sql,
  options: SchemaFromDatabaseOptions = {},
): Promise<DatabaseSchema> => {
  const db = new Kysely<PostgresDB>({ dialect: new PostgresJSDialect({ postgres }) });
  const ctx = new ReaderContext(options);

  try {
    for (const reader of readers) {
      await reader(ctx, db);
    }

    return ctx.build();
  } finally {
    await db.destroy();
  }
};
