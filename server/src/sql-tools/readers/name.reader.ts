import { QueryResult, sql } from 'kysely';
import { DatabaseReader } from 'src/sql-tools/types';

export const readName: DatabaseReader = async (schema, db) => {
  const result = (await sql`SELECT current_database() as name`.execute(db)) as QueryResult<{ name: string }>;

  schema.databaseName = result.rows[0].name;
};
