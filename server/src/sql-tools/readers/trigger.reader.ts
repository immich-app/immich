import { Reader, TriggerAction, TriggerScope, TriggerTiming } from 'src/sql-tools/types';

export const readTriggers: Reader = async (ctx, db) => {
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
    .where('n.nspname', '=', ctx.schemaName)
    .execute();

  // add triggers to tables
  for (const trigger of triggers) {
    const table = ctx.getTableByName(trigger.table_name);
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

export const hasMask = (input: number, mask: number) => (input & mask) === mask;

export const parseTriggerType = (type: number) => {
  // eslint-disable-next-line unicorn/prefer-math-trunc
  const scope: TriggerScope = hasMask(type, 1 << 0) ? 'row' : 'statement';

  let timing: TriggerTiming = 'after';
  const timingMasks: Array<{ mask: number; value: TriggerTiming }> = [
    { mask: 1 << 1, value: 'before' },
    { mask: 1 << 6, value: 'instead of' },
  ];

  for (const { mask, value } of timingMasks) {
    if (hasMask(type, mask)) {
      timing = value;
      break;
    }
  }

  const actions: TriggerAction[] = [];
  const actionMasks: Array<{ mask: number; value: TriggerAction }> = [
    { mask: 1 << 2, value: 'insert' },
    { mask: 1 << 3, value: 'delete' },
    { mask: 1 << 4, value: 'update' },
    { mask: 1 << 5, value: 'truncate' },
  ];

  for (const { mask, value } of actionMasks) {
    if (hasMask(type, mask)) {
      actions.push(value);
      break;
    }
  }

  if (actions.length === 0) {
    throw new Error(`Unable to parse trigger type ${type}`);
  }

  return { actions, timing, scope };
};
