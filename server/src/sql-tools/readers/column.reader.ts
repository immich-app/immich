import { sql } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { ColumnType, DatabaseColumn, Reader } from 'src/sql-tools/types';

export const readColumns: Reader = async (ctx, db) => {
  const columns = await db
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
    .where('table_schema', '=', ctx.schemaName)
    .execute();

  const enumRaw = await db
    .selectFrom('pg_type')
    .innerJoin('pg_namespace', (join) =>
      join.onRef('pg_namespace.oid', '=', 'pg_type.typnamespace').on('pg_namespace.nspname', '=', ctx.schemaName),
    )
    .where('typtype', '=', sql.lit('e'))
    .select((eb) => [
      'pg_type.typname as name',
      jsonArrayFrom(
        eb.selectFrom('pg_enum as e').select(['e.enumlabel as value']).whereRef('e.enumtypid', '=', 'pg_type.oid'),
      ).as('values'),
    ])
    .execute();

  const enums = enumRaw.map((item) => ({ name: item.name, values: item.values.map(({ value }) => value) }));
  for (const { name, values } of enums) {
    ctx.enums.push({ name, values, synchronize: true });
  }

  const enumMap = Object.fromEntries(enums.map((e) => [e.name, e.values]));
  // add columns to tables
  for (const column of columns) {
    const table = ctx.getTableByName(column.table_name);
    if (!table) {
      continue;
    }

    const columnName = column.column_name;

    const item: DatabaseColumn = {
      type: column.data_type as ColumnType,
      // TODO infer this from PK constraints
      primary: false,
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
          ctx.warnings.push(`Unable to find type for ${columnLabel} (ARRAY)`);
          continue;
        }
        item.type = column.array_type as ColumnType;
        break;
      }

      // enum types
      case 'USER-DEFINED': {
        if (!enumMap[column.udt_name]) {
          ctx.warnings.push(`Unable to find type for ${columnLabel} (ENUM)`);
          continue;
        }

        item.type = 'enum';
        item.enumName = column.udt_name;
        break;
      }
    }

    table.columns.push(item);
  }
};
