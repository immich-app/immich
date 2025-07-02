import { sql } from 'kysely';
import { DatabaseReader } from 'src/sql-tools/types';

export const readFunctions: DatabaseReader = async (schema, db) => {
  const routines = await db
    .selectFrom('pg_proc as p')
    .innerJoin('pg_namespace', 'pg_namespace.oid', 'p.pronamespace')
    .leftJoin('pg_depend as d', (join) => join.onRef('d.objid', '=', 'p.oid').on('d.deptype', '=', sql.lit('e')))
    .where('d.objid', 'is', sql.lit(null))
    .where('p.prokind', '=', sql.lit('f'))
    .where('pg_namespace.nspname', '=', schema.schemaName)
    .select((eb) => [
      'p.proname as name',
      eb.fn<string>('pg_get_function_identity_arguments', ['p.oid']).as('arguments'),
      eb.fn<string>('pg_get_functiondef', ['p.oid']).as('expression'),
    ])
    .execute();

  for (const { name, expression } of routines) {
    schema.functions.push({
      name,
      // TODO read expression from the overrides table
      expression,
      synchronize: true,
    });
  }
};
