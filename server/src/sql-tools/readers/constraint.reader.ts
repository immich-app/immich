import { sql } from 'kysely';
import { ActionType, ConstraintType, Reader } from 'src/sql-tools/types';

export const readConstraints: Reader = async (ctx, db) => {
  const constraints = await db
    .selectFrom('pg_constraint')
    .innerJoin('pg_namespace', 'pg_namespace.oid', 'pg_constraint.connamespace') // namespace
    .innerJoin('pg_class as source_table', (join) =>
      join.onRef('source_table.oid', '=', 'pg_constraint.conrelid').on('source_table.relkind', 'in', [
        // ordinary table
        sql.lit('r'),
        // partitioned table
        sql.lit('p'),
        // foreign table
        sql.lit('f'),
      ]),
    ) // table
    .leftJoin('pg_class as reference_table', 'reference_table.oid', 'pg_constraint.confrelid') // reference table
    .select((eb) => [
      'pg_constraint.contype as constraint_type',
      'pg_constraint.conname as constraint_name',
      'source_table.relname as table_name',
      'reference_table.relname as reference_table_name',
      'pg_constraint.confupdtype as update_action',
      'pg_constraint.confdeltype as delete_action',
      // 'pg_constraint.oid as constraint_id',
      eb
        .selectFrom('pg_attribute')
        // matching table for PK, FK, and UQ
        .whereRef('pg_attribute.attrelid', '=', 'pg_constraint.conrelid')
        .whereRef('pg_attribute.attnum', '=', sql`any("pg_constraint"."conkey")`)
        .select((eb) => eb.fn<string[]>('json_agg', ['pg_attribute.attname']).as('column_name'))
        .as('column_names'),
      eb
        .selectFrom('pg_attribute')
        // matching foreign table for FK
        .whereRef('pg_attribute.attrelid', '=', 'pg_constraint.confrelid')
        .whereRef('pg_attribute.attnum', '=', sql`any("pg_constraint"."confkey")`)
        .select((eb) => eb.fn<string[]>('json_agg', ['pg_attribute.attname']).as('column_name'))
        .as('reference_column_names'),
      eb.fn<string>('pg_get_constraintdef', ['pg_constraint.oid']).as('expression'),
    ])
    .where('pg_namespace.nspname', '=', ctx.schemaName)
    .execute();

  for (const constraint of constraints) {
    const table = ctx.getTableByName(constraint.table_name);
    if (!table) {
      continue;
    }

    const constraintName = constraint.constraint_name;

    switch (constraint.constraint_type) {
      // primary key constraint
      case 'p': {
        if (!constraint.column_names) {
          ctx.warnings.push(`Skipping CONSTRAINT "${constraintName}", no columns found`);
          continue;
        }
        table.constraints.push({
          type: ConstraintType.PRIMARY_KEY,
          name: constraintName,
          tableName: constraint.table_name,
          columnNames: constraint.column_names,
          synchronize: true,
        });
        break;
      }

      // foreign key constraint
      case 'f': {
        if (!constraint.column_names || !constraint.reference_table_name || !constraint.reference_column_names) {
          ctx.warnings.push(
            `Skipping CONSTRAINT "${constraintName}", missing either columns, referenced table, or referenced columns,`,
          );
          continue;
        }

        table.constraints.push({
          type: ConstraintType.FOREIGN_KEY,
          name: constraintName,
          tableName: constraint.table_name,
          columnNames: constraint.column_names,
          referenceTableName: constraint.reference_table_name,
          referenceColumnNames: constraint.reference_column_names,
          onUpdate: asDatabaseAction(constraint.update_action),
          onDelete: asDatabaseAction(constraint.delete_action),
          synchronize: true,
        });
        break;
      }

      // unique constraint
      case 'u': {
        table.constraints.push({
          type: ConstraintType.UNIQUE,
          name: constraintName,
          tableName: constraint.table_name,
          columnNames: constraint.column_names as string[],
          synchronize: true,
        });
        break;
      }

      //  check constraint
      case 'c': {
        table.constraints.push({
          type: ConstraintType.CHECK,
          name: constraint.constraint_name,
          tableName: constraint.table_name,
          expression: constraint.expression.replace('CHECK ', ''),
          synchronize: true,
        });
        break;
      }
    }
  }
};

const asDatabaseAction = (action: string) => {
  switch (action) {
    case 'a': {
      return ActionType.NO_ACTION;
    }
    case 'c': {
      return ActionType.CASCADE;
    }
    case 'r': {
      return ActionType.RESTRICT;
    }
    case 'n': {
      return ActionType.SET_NULL;
    }
    case 'd': {
      return ActionType.SET_DEFAULT;
    }

    default: {
      return ActionType.NO_ACTION;
    }
  }
};
