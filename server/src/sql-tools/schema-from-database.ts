import { Kysely, sql } from 'kysely';
import { PostgresJSDialect } from 'kysely-postgres-js';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { Sql } from 'postgres';
import {
  DatabaseActionType,
  DatabaseClient,
  DatabaseColumn,
  DatabaseColumnType,
  DatabaseConstraintType,
  DatabaseSchema,
  DatabaseTable,
  LoadSchemaOptions,
  PostgresDB,
} from 'src/sql-tools/types';

/**
 * Load the database schema from the database
 */
export const schemaFromDatabase = async (postgres: Sql, options: LoadSchemaOptions = {}): Promise<DatabaseSchema> => {
  const db = createDatabaseClient(postgres);

  const warnings: string[] = [];
  const warn = (message: string) => {
    warnings.push(message);
  };

  const schemaName = options.schemaName || 'public';
  const tablesMap: Record<string, DatabaseTable> = {};

  const [tables, columns, indexes, constraints, enums] = await Promise.all([
    getTables(db, schemaName),
    getTableColumns(db, schemaName),
    getTableIndexes(db, schemaName),
    getTableConstraints(db, schemaName),
    getUserDefinedEnums(db, schemaName),
  ]);

  const enumMap = Object.fromEntries(enums.map((e) => [e.name, e.values]));

  // add tables
  for (const table of tables) {
    const tableName = table.table_name;
    if (tablesMap[tableName]) {
      continue;
    }

    tablesMap[table.table_name] = {
      name: table.table_name,
      columns: [],
      indexes: [],
      constraints: [],
      synchronize: true,
    };
  }

  // add columns to tables
  for (const column of columns) {
    const table = tablesMap[column.table_name];
    if (!table) {
      continue;
    }

    const columnName = column.column_name;

    const item: DatabaseColumn = {
      type: column.data_type as DatabaseColumnType,
      name: columnName,
      tableName: column.table_name,
      nullable: column.is_nullable === 'YES',
      isArray: column.array_type !== null,
      numericPrecision: column.numeric_precision ?? undefined,
      numericScale: column.numeric_scale ?? undefined,
      default: column.column_default ?? undefined,
      synchronize: true,
    };

    const columnLabel = `${table.name}.${columnName}`;

    switch (column.data_type) {
      // array types
      case 'ARRAY': {
        if (!column.array_type) {
          warn(`Unable to find type for ${columnLabel} (ARRAY)`);
          continue;
        }
        item.type = column.array_type as DatabaseColumnType;
        break;
      }

      // enum types
      case 'USER-DEFINED': {
        if (!enumMap[column.udt_name]) {
          warn(`Unable to find type for ${columnLabel} (ENUM)`);
          continue;
        }

        item.type = 'enum';
        item.enumName = column.udt_name;
        item.enumValues = enumMap[column.udt_name];
        break;
      }
    }

    table.columns.push(item);
  }

  // add table indexes
  for (const index of indexes) {
    const table = tablesMap[index.table_name];
    if (!table) {
      continue;
    }

    const indexName = index.index_name;

    table.indexes.push({
      name: indexName,
      tableName: index.table_name,
      columnNames: index.column_names ?? undefined,
      expression: index.expression ?? undefined,
      using: index.using,
      where: index.where ?? undefined,
      unique: index.unique,
      synchronize: true,
    });
  }

  // add table constraints
  for (const constraint of constraints) {
    const table = tablesMap[constraint.table_name];
    if (!table) {
      continue;
    }

    const constraintName = constraint.constraint_name;

    switch (constraint.constraint_type) {
      // primary key constraint
      case 'p': {
        if (!constraint.column_names) {
          warn(`Skipping CONSTRAINT "${constraintName}", no columns found`);
          continue;
        }
        table.constraints.push({
          type: DatabaseConstraintType.PRIMARY_KEY,
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
          warn(
            `Skipping CONSTRAINT "${constraintName}", missing either columns, referenced table, or referenced columns,`,
          );
          continue;
        }

        table.constraints.push({
          type: DatabaseConstraintType.FOREIGN_KEY,
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
          type: DatabaseConstraintType.UNIQUE,
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
          type: DatabaseConstraintType.CHECK,
          name: constraint.constraint_name,
          tableName: constraint.table_name,
          expression: constraint.expression.replace('CHECK ', ''),
          synchronize: true,
        });
        break;
      }
    }
  }

  await db.destroy();

  return {
    name: schemaName,
    tables: Object.values(tablesMap),
    warnings,
  };
};

const createDatabaseClient = (postgres: Sql): DatabaseClient =>
  new Kysely<PostgresDB>({ dialect: new PostgresJSDialect({ postgres }) });

const asDatabaseAction = (action: string) => {
  switch (action) {
    case 'a': {
      return DatabaseActionType.NO_ACTION;
    }
    case 'c': {
      return DatabaseActionType.CASCADE;
    }
    case 'r': {
      return DatabaseActionType.RESTRICT;
    }
    case 'n': {
      return DatabaseActionType.SET_NULL;
    }
    case 'd': {
      return DatabaseActionType.SET_DEFAULT;
    }

    default: {
      return DatabaseActionType.NO_ACTION;
    }
  }
};

const getTables = (db: DatabaseClient, schemaName: string) => {
  return db
    .selectFrom('information_schema.tables')
    .where('table_schema', '=', schemaName)
    .where('table_type', '=', sql.lit('BASE TABLE'))
    .selectAll()
    .execute();
};

const getUserDefinedEnums = async (db: DatabaseClient, schemaName: string) => {
  const items = await db
    .selectFrom('pg_type')
    .innerJoin('pg_namespace', (join) =>
      join.onRef('pg_namespace.oid', '=', 'pg_type.typnamespace').on('pg_namespace.nspname', '=', schemaName),
    )
    .where('typtype', '=', sql.lit('e'))
    .select((eb) => [
      'pg_type.typname as name',
      jsonArrayFrom(
        eb.selectFrom('pg_enum as e').select(['e.enumlabel as value']).whereRef('e.enumtypid', '=', 'pg_type.oid'),
      ).as('values'),
    ])
    .execute();

  return items.map((item) => ({
    name: item.name,
    values: item.values.map(({ value }) => value),
  }));
};

const getTableColumns = (db: DatabaseClient, schemaName: string) => {
  return db
    .selectFrom('information_schema.columns as c')
    .leftJoin('information_schema.element_types as o', (join) =>
      join
        .onRef('c.table_catalog', '=', 'o.object_catalog')
        .onRef('c.table_schema', '=', 'o.object_schema')
        .onRef('c.table_name', '=', 'o.object_name')
        .on('o.object_type', '=', sql.lit('TABLE'))
        .onRef('c.dtd_identifier', '=', 'o.collection_type_identifier'),
    )
    .leftJoin('pg_type as t', (join) =>
      join.onRef('t.typname', '=', 'c.udt_name').on('c.data_type', '=', sql.lit('USER-DEFINED')),
    )
    .leftJoin('pg_enum as e', (join) => join.onRef('e.enumtypid', '=', 't.oid'))
    .select([
      'c.table_name',
      'c.column_name',

      // is ARRAY, USER-DEFINED, or data type
      'c.data_type',
      'c.column_default',
      'c.is_nullable',

      // number types
      'c.numeric_precision',
      'c.numeric_scale',

      // date types
      'c.datetime_precision',

      // user defined type
      'c.udt_catalog',
      'c.udt_schema',
      'c.udt_name',

      // data type for ARRAYs
      'o.data_type as array_type',
    ])
    .where('table_schema', '=', schemaName)
    .execute();
};

const getTableIndexes = (db: DatabaseClient, schemaName: string) => {
  return (
    db
      .selectFrom('pg_index as ix')
      // matching index, which has column information
      .innerJoin('pg_class as i', 'ix.indexrelid', 'i.oid')
      .innerJoin('pg_am as a', 'i.relam', 'a.oid')
      // matching table
      .innerJoin('pg_class as t', 'ix.indrelid', 't.oid')
      // namespace
      .innerJoin('pg_namespace', 'pg_namespace.oid', 'i.relnamespace')
      // PK and UQ constraints automatically have indexes, so we can ignore those
      .leftJoin('pg_constraint', (join) =>
        join
          .onRef('pg_constraint.conindid', '=', 'i.oid')
          .on('pg_constraint.contype', 'in', [sql.lit('p'), sql.lit('u')]),
      )
      .where('pg_constraint.oid', 'is', null)
      .select((eb) => [
        'i.relname as index_name',
        't.relname as table_name',
        'ix.indisunique as unique',
        'a.amname as using',
        eb.fn<string>('pg_get_expr', ['ix.indexprs', 'ix.indrelid']).as('expression'),
        eb.fn<string>('pg_get_expr', ['ix.indpred', 'ix.indrelid']).as('where'),
        eb
          .selectFrom('pg_attribute as a')
          .where('t.relkind', '=', sql.lit('r'))
          .whereRef('a.attrelid', '=', 't.oid')
          // list of columns numbers in the index
          .whereRef('a.attnum', '=', sql`any("ix"."indkey")`)
          .select((eb) => eb.fn<string[]>('json_agg', ['a.attname']).as('column_name'))
          .as('column_names'),
      ])
      .where('pg_namespace.nspname', '=', schemaName)
      .where('ix.indisprimary', '=', sql.lit(false))
      .execute()
  );
};

const getTableConstraints = (db: DatabaseClient, schemaName: string) => {
  return db
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
    .where('pg_namespace.nspname', '=', schemaName)
    .execute();
};
