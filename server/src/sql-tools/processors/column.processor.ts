import { ColumnOptions } from 'src/sql-tools/decorators/column.decorator';
import { fromColumnValue } from 'src/sql-tools/helpers';
import { Processor } from 'src/sql-tools/types';

export const processColumns: Processor = (builder, items) => {
  for (const {
    type,
    item: { object, propertyName, options },
  } of items.filter((item) => item.type === 'column' || item.type === 'foreignKeyColumn')) {
    const table = builder.getTableByObject(object.constructor);
    if (!table) {
      builder.warnMissingTable(type === 'column' ? '@Column' : '@ForeignKeyColumn', object, propertyName);
      continue;
    }

    const columnName = options.name ?? String(propertyName);
    const existingColumn = table.columns.find((column) => column.name === columnName);
    if (existingColumn) {
      // TODO log warnings if column name is not unique
      continue;
    }

    let defaultValue = fromColumnValue(options.default);
    let nullable = options.nullable ?? false;

    // map `{ default: null }` to `{ nullable: true }`
    if (defaultValue === null) {
      nullable = true;
      defaultValue = undefined;
    }

    const isEnum = !!(options as ColumnOptions).enum;

    builder.addColumn(
      table,
      {
        name: columnName,
        tableName: table.name,
        primary: options.primary ?? false,
        default: defaultValue,
        nullable,
        isArray: (options as ColumnOptions).array ?? false,
        length: options.length,
        type: isEnum ? 'enum' : options.type || 'character varying',
        enumName: isEnum ? (options as ColumnOptions).enum!.name : undefined,
        comment: options.comment,
        storage: options.storage,
        identity: options.identity,
        synchronize: options.synchronize ?? true,
      },
      options,
      propertyName,
    );
  }
};
