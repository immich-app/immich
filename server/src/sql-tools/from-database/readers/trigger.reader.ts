import { DatabaseReader } from 'src/sql-tools/from-database/readers/type';
import { parseTriggerType } from 'src/sql-tools/helpers';

export const readTriggers: DatabaseReader = async (schema, db) => {
  const triggers = await db
    .selectFrom('pg_trigger as t')
    .innerJoin('pg_proc as p', 't.tgfoid', 'p.oid')
    .innerJoin('pg_namespace as n', 'p.pronamespace', 'n.oid')
    .innerJoin('pg_class as c', 't.tgrelid', 'c.oid')
    .select((eb) => [
      't.tgname as name',
      't.tgenabled as enabled',
      't.tgtype as type',
      't.tgconstraint as _constraint',
      't.tgdeferrable as is_deferrable',
      't.tginitdeferred as is_initially_deferred',
      't.tgargs as arguments',
      't.tgoldtable as referencing_old_table_as',
      't.tgnewtable as referencing_new_table_as',
      eb.fn<string>('pg_get_expr', ['t.tgqual', 't.tgrelid']).as('when_expression'),
      'p.proname as function_name',
      'c.relname as table_name',
    ])
    .where('t.tgisinternal', '=', false) // Exclude internal system triggers
    .where('n.nspname', '=', schema.schemaName)
    .execute();

  // add triggers to tables
  for (const trigger of triggers) {
    const table = schema.tables.find((table) => table.name === trigger.table_name);
    if (!table) {
      continue;
    }

    table.triggers.push({
      name: trigger.name,
      tableName: trigger.table_name,
      functionName: trigger.function_name,
      referencingNewTableAs: trigger.referencing_new_table_as ?? undefined,
      referencingOldTableAs: trigger.referencing_old_table_as ?? undefined,
      when: trigger.when_expression,
      synchronize: true,
      ...parseTriggerType(trigger.type),
    });
  }
};
