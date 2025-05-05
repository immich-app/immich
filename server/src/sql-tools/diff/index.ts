import { compareEnums } from 'src/sql-tools/diff/comparers/enum.comparer';
import { compareExtensions } from 'src/sql-tools/diff/comparers/extension.comparer';
import { compareFunctions } from 'src/sql-tools/diff/comparers/function.comparer';
import { compareParameters } from 'src/sql-tools/diff/comparers/parameter.comparer';
import { compareTables } from 'src/sql-tools/diff/comparers/table.comparer';
import { compare } from 'src/sql-tools/helpers';
import { schemaDiffToSql } from 'src/sql-tools/to-sql';
import {
  DatabaseConstraintType,
  DatabaseSchema,
  SchemaDiff,
  SchemaDiffOptions,
  SchemaDiffToSqlOptions,
} from 'src/sql-tools/types';

/**
 * Compute the difference between two database schemas
 */
export const schemaDiff = (source: DatabaseSchema, target: DatabaseSchema, options: SchemaDiffOptions = {}) => {
  const items = [
    ...compare(source.parameters, target.parameters, options.parameters, compareParameters),
    ...compare(source.extensions, target.extensions, options.extension, compareExtensions),
    ...compare(source.functions, target.functions, options.functions, compareFunctions),
    ...compare(source.enums, target.enums, options.enums, compareEnums),
    ...compare(source.tables, target.tables, options.tables, compareTables),
  ];

  type SchemaName = SchemaDiff['type'];
  const itemMap: Record<SchemaName, SchemaDiff[]> = {
    'enum.create': [],
    'enum.drop': [],
    'extension.create': [],
    'extension.drop': [],
    'function.create': [],
    'function.drop': [],
    'table.create': [],
    'table.drop': [],
    'column.add': [],
    'column.alter': [],
    'column.drop': [],
    'constraint.add': [],
    'constraint.drop': [],
    'index.create': [],
    'index.drop': [],
    'trigger.create': [],
    'trigger.drop': [],
    'parameter.set': [],
    'parameter.reset': [],
  };

  for (const item of items) {
    itemMap[item.type].push(item);
  }

  const constraintAdds = itemMap['constraint.add'].filter((item) => item.type === 'constraint.add');

  const orderedItems = [
    ...itemMap['extension.create'],
    ...itemMap['function.create'],
    ...itemMap['parameter.set'],
    ...itemMap['parameter.reset'],
    ...itemMap['enum.create'],
    ...itemMap['trigger.drop'],
    ...itemMap['index.drop'],
    ...itemMap['constraint.drop'],
    ...itemMap['table.create'],
    ...itemMap['column.alter'],
    ...itemMap['column.add'],
    ...constraintAdds.filter(({ constraint }) => constraint.type === DatabaseConstraintType.PRIMARY_KEY),
    ...constraintAdds.filter(({ constraint }) => constraint.type === DatabaseConstraintType.FOREIGN_KEY),
    ...constraintAdds.filter(({ constraint }) => constraint.type === DatabaseConstraintType.UNIQUE),
    ...constraintAdds.filter(({ constraint }) => constraint.type === DatabaseConstraintType.CHECK),
    ...itemMap['index.create'],
    ...itemMap['trigger.create'],
    ...itemMap['column.drop'],
    ...itemMap['table.drop'],
    ...itemMap['enum.drop'],
    ...itemMap['function.drop'],
  ];

  return {
    items: orderedItems,
    asSql: (options?: SchemaDiffToSqlOptions) => schemaDiffToSql(orderedItems, options),
  };
};
