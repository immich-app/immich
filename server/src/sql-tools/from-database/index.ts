import { Kysely } from 'kysely';
import { PostgresJSDialect } from 'kysely-postgres-js';
import { Sql } from 'postgres';
import { readColumns } from 'src/sql-tools/from-database/readers/column.reader';
import { readComments } from 'src/sql-tools/from-database/readers/comment.reader';
import { readConstraints } from 'src/sql-tools/from-database/readers/constraint.reader';
import { readExtensions } from 'src/sql-tools/from-database/readers/extension.reader';
import { readFunctions } from 'src/sql-tools/from-database/readers/function.reader';
import { readIndexes } from 'src/sql-tools/from-database/readers/index.reader';
import { readName } from 'src/sql-tools/from-database/readers/name.reader';
import { readParameters } from 'src/sql-tools/from-database/readers/parameter.reader';
import { readTables } from 'src/sql-tools/from-database/readers/table.reader';
import { readTriggers } from 'src/sql-tools/from-database/readers/trigger.reader';
import { DatabaseReader } from 'src/sql-tools/from-database/readers/type';
import { DatabaseSchema, LoadSchemaOptions, PostgresDB } from 'src/sql-tools/types';

const readers: DatabaseReader[] = [
  //
  readName,
  readParameters,
  readExtensions,
  readFunctions,
  readTables,
  readColumns,
  readIndexes,
  readConstraints,
  readTriggers,
  readComments,
];

/**
 * Load the database schema from the database
 */
export const schemaFromDatabase = async (postgres: Sql, options: LoadSchemaOptions = {}): Promise<DatabaseSchema> => {
  const schema: DatabaseSchema = {
    name: 'immich',
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
