import { sql } from 'kysely';
import { DatabaseReader } from 'src/sql-tools/types';

export const readTables: DatabaseReader = async (schema, db) => {
  const tables = await db
    .selectFrom('information_schema.tables')
    .where('table_schema', '=', schema.schemaName)
    .where('table_type', '=', sql.lit('BASE TABLE'))
    .selectAll()
    .execute();

  for (const table of tables) {
    schema.tables.push({
      name: table.table_name,
      columns: [],
      indexes: [],
      triggers: [],
      constraints: [],
      synchronize: true,
    });
  }
};
