import { DatabaseReader } from 'src/sql-tools/types';

export const readExtensions: DatabaseReader = async (schema, db) => {
  const extensions = await db
    .selectFrom('pg_catalog.pg_extension')
    // .innerJoin('pg_namespace', 'pg_namespace.oid', 'pg_catalog.pg_extension.extnamespace')
    // .where('pg_namespace.nspname', '=', schemaName)
    .select(['extname as name', 'extversion as version'])
    .execute();

  for (const { name } of extensions) {
    schema.extensions.push({ name, synchronize: true });
  }
};
