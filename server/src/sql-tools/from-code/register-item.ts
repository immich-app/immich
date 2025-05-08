import { CheckOptions } from 'src/sql-tools/from-code/decorators/check.decorator';
import { ColumnOptions } from 'src/sql-tools/from-code/decorators/column.decorator';
import { ConfigurationParameterOptions } from 'src/sql-tools/from-code/decorators/configuration-parameter.decorator';
import { DatabaseOptions } from 'src/sql-tools/from-code/decorators/database.decorator';
import { ExtensionOptions } from 'src/sql-tools/from-code/decorators/extension.decorator';
import { ForeignKeyColumnOptions } from 'src/sql-tools/from-code/decorators/foreign-key-column.decorator';
import { IndexOptions } from 'src/sql-tools/from-code/decorators/index.decorator';
import { TableOptions } from 'src/sql-tools/from-code/decorators/table.decorator';
import { TriggerOptions } from 'src/sql-tools/from-code/decorators/trigger.decorator';
import { UniqueOptions } from 'src/sql-tools/from-code/decorators/unique.decorator';
import { DatabaseEnum, DatabaseFunction } from 'src/sql-tools/types';

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type ClassBased<T> = { object: Function } & T;
export type PropertyBased<T> = { object: object; propertyName: string | symbol } & T;
export type RegisterItem =
  | { type: 'database'; item: ClassBased<{ options: DatabaseOptions }> }
  | { type: 'table'; item: ClassBased<{ options: TableOptions }> }
  | { type: 'index'; item: ClassBased<{ options: IndexOptions }> }
  | { type: 'uniqueConstraint'; item: ClassBased<{ options: UniqueOptions }> }
  | { type: 'checkConstraint'; item: ClassBased<{ options: CheckOptions }> }
  | { type: 'column'; item: PropertyBased<{ options: ColumnOptions }> }
  | { type: 'function'; item: DatabaseFunction }
  | { type: 'enum'; item: DatabaseEnum }
  | { type: 'trigger'; item: ClassBased<{ options: TriggerOptions }> }
  | { type: 'extension'; item: ClassBased<{ options: ExtensionOptions }> }
  | { type: 'configurationParameter'; item: ClassBased<{ options: ConfigurationParameterOptions }> }
  | { type: 'foreignKeyColumn'; item: PropertyBased<{ options: ForeignKeyColumnOptions; target: () => object }> };
export type RegisterItemType<T extends RegisterItem['type']> = Extract<RegisterItem, { type: T }>['item'];
