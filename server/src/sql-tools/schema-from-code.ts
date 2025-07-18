import { ProcessorContext } from 'src/sql-tools/contexts/processor-context';
import { processors } from 'src/sql-tools/processors';
import { getRegisteredItems, resetRegisteredItems } from 'src/sql-tools/register';
import { ConstraintType, SchemaFromCodeOptions } from 'src/sql-tools/types';

/**
 * Load schema from code (decorators, etc)
 */
export const schemaFromCode = (options: SchemaFromCodeOptions = {}) => {
  try {
    const ctx = new ProcessorContext(options);
    const items = getRegisteredItems();

    for (const processor of processors) {
      processor(ctx, items);
    }

    if (ctx.options.overrides) {
      ctx.tables.push({
        name: ctx.overrideTableName,
        columns: [
          {
            name: 'name',
            tableName: ctx.overrideTableName,
            primary: true,
            type: 'character varying',
            nullable: false,
            isArray: false,
            synchronize: true,
          },
          {
            name: 'value',
            tableName: ctx.overrideTableName,
            primary: false,
            type: 'jsonb',
            nullable: false,
            isArray: false,
            synchronize: true,
          },
        ],
        indexes: [],
        triggers: [],
        constraints: [
          {
            type: ConstraintType.PRIMARY_KEY,
            name: `${ctx.overrideTableName}_pkey`,
            tableName: ctx.overrideTableName,
            columnNames: ['name'],
            synchronize: true,
          },
        ],
        synchronize: true,
      });
    }

    return ctx.build();
  } finally {
    if (options.reset) {
      resetRegisteredItems();
    }
  }
};
