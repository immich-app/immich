import { sql } from 'kysely';
import { Reader } from 'src/sql-tools/types';

export const readTables: Reader = async (ctx, db) => {
  const tables = await db
    .selectFrom('information_schema.tables')
    .where('table_schema', '=', ctx.schemaName)
    .where('table_type', '=', sql.lit('BASE TABLE'))
    .selectAll()
    .execute();

  for (const table of tables) {
    ctx.tables.push({
      name: table.table_name,
      columns: [],
      indexes: [],
      triggers: [],
      constraints: [],
      synchronize: true,
    });
  }
};
