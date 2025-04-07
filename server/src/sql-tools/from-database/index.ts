import { Kysely, QueryResult, sql } from 'kysely';
import { PostgresJSDialect } from 'kysely-postgres-js';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { Sql } from 'postgres';
import { parseTriggerType } from 'src/sql-tools/helpers';
import {
  ColumnType,
  DatabaseActionType,
  DatabaseClient,
  DatabaseColumn,
  DatabaseConstraintType,
  DatabaseEnum,
  DatabaseExtension,
  DatabaseFunction,
  DatabaseParameter,
  DatabaseSchema,
  DatabaseTable,
  LoadSchemaOptions,
  ParameterScope,
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

  const [
    databaseName,
    tables,
    columns,
    indexes,
    constraints,
    enums,
    routines,
    extensions,
    triggers,
    parameters,
    comments,
  ] = await Promise.all([
    getDatabaseName(db),
    getTables(db, schemaName),
    getTableColumns(db, schemaName),
    getTableIndexes(db, schemaName),
    getTableConstraints(db, schemaName),
    getUserDefinedEnums(db, schemaName),
    getRoutines(db, schemaName),
    getExtensions(db),
    getTriggers(db, schemaName),
    getParameters(db),
    getObjectComments(db),
  ]);

  const schemaEnums: DatabaseEnum[] = [];
  const schemaFunctions: DatabaseFunction[] = [];
  const schemaExtensions: DatabaseExtension[] = [];
  const schemaParameters: DatabaseParameter[] = [];

  const enumMap = Object.fromEntries(enums.map((e) => [e.name, e.values]));

  for (const { name } of extensions) {
    schemaExtensions.push({ name, synchronize: true });
  }

  for (const { name, values } of enums) {
    schemaEnums.push({ name, values, synchronize: true });
  }

  for (const parameter of parameters) {
    schemaParameters.push({
      name: parameter.name,
      value: parameter.value,
      databaseName,
      scope: parameter.scope as ParameterScope,
      synchronize: true,
    });
  }

  for (const { name, expression } of routines) {
    schemaFunctions.push({
      name,
      // TODO read expression from the overrides table
      expression,
      synchronize: true,
    });
  }

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
      triggers: [],
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
      type: column.data_type as ColumnType,
      name: columnName,
      tableName: column.table_name,
      nullable: column.is_nullable === 'YES',
      isArray: column.array_type !== null,
      numericPrecision: column.numeric_precision ?? undefined,
      numericScale: column.numeric_scale ?? undefined,
      length: column.character_maximum_length ?? undefined,
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
        item.type = column.array_type as ColumnType;
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

  // add triggers to tables
  for (const trigger of triggers) {
    const table = tablesMap[trigger.table_name];
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

  for (const comment of comments) {
    if (comment.object_type === 'r') {
      const table = tablesMap[comment.object_name];
      if (!table) {
        continue;
      }

      if (comment.column_name) {
        const column = table.columns.find(({ name }) => name === comment.column_name);
        if (column) {
          column.comment = comment.value;
        }
      }
    }
  }

  await db.destroy();

  return {
    name: databaseName,
    schemaName,
    parameters: schemaParameters,
    functions: schemaFunctions,
    enums: schemaEnums,
    extensions: schemaExtensions,
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

const getDatabaseName = async (db: DatabaseClient) => {
  const result = (await sql`SELECT current_database() as name`.execute(db)) as QueryResult<{ name: string }>;
  return result.rows[0].name;
};

const getTables = (db: DatabaseClient, schemaName: string) => {
  return db
    .selectFrom('information_schema.tables')
    .where('table_schema', '=', schemaName)
    .where('table_type', '=', sql.lit('BASE TABLE'))
    .selectAll()
    .execute();
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
      'c.character_maximum_length',

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

const getRoutines = async (db: DatabaseClient, schemaName: string) => {
  return db
    .selectFrom('pg_proc as p')
    .innerJoin('pg_namespace', 'pg_namespace.oid', 'p.pronamespace')
    .leftJoin('pg_depend as d', (join) => join.onRef('d.objid', '=', 'p.oid').on('d.deptype', '=', sql.lit('e')))
    .where('d.objid', 'is', sql.lit(null))
    .where('p.prokind', '=', sql.lit('f'))
    .where('pg_namespace.nspname', '=', schemaName)
    .select((eb) => [
      'p.proname as name',
      eb.fn<string>('pg_get_function_identity_arguments', ['p.oid']).as('arguments'),
      eb.fn<string>('pg_get_functiondef', ['p.oid']).as('expression'),
    ])
    .execute();
};

const getExtensions = async (db: DatabaseClient) => {
  return (
    db
      .selectFrom('pg_catalog.pg_extension')
      // .innerJoin('pg_namespace', 'pg_namespace.oid', 'pg_catalog.pg_extension.extnamespace')
      // .where('pg_namespace.nspname', '=', schemaName)
      .select(['extname as name', 'extversion as version'])
      .execute()
  );
};

const getTriggers = async (db: Kysely<PostgresDB>, schemaName: string) => {
  return db
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
    .where('n.nspname', '=', schemaName)
    .execute();
};

const getParameters = async (db: Kysely<PostgresDB>) => {
  return db
    .selectFrom('pg_settings')
    .where('source', 'in', [sql.lit('database'), sql.lit('user')])
    .select(['name', 'setting as value', 'source as scope'])
    .execute();
};

const getObjectComments = async (db: Kysely<PostgresDB>) => {
  return db
    .selectFrom('pg_description as d')
    .innerJoin('pg_class as c', 'd.objoid', 'c.oid')
    .leftJoin('pg_attribute as a', (join) =>
      join.onRef('a.attrelid', '=', 'c.oid').onRef('a.attnum', '=', 'd.objsubid'),
    )
    .select([
      'c.relname as object_name',
      'c.relkind as object_type',
      'd.description as value',
      'a.attname as column_name',
    ])
    .where('d.description', 'is not', null)
    .orderBy('object_type')
    .orderBy('object_name')
    .execute();
};
