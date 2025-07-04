/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { CheckOptions } from 'src/sql-tools/decorators/check.decorator';
import { ColumnOptions } from 'src/sql-tools/decorators/column.decorator';
import { ConfigurationParameterOptions } from 'src/sql-tools/decorators/configuration-parameter.decorator';
import { DatabaseOptions } from 'src/sql-tools/decorators/database.decorator';
import { ExtensionOptions } from 'src/sql-tools/decorators/extension.decorator';
import { ForeignKeyColumnOptions } from 'src/sql-tools/decorators/foreign-key-column.decorator';
import { ForeignKeyConstraintOptions } from 'src/sql-tools/decorators/foreign-key-constraint.decorator';
import { IndexOptions } from 'src/sql-tools/decorators/index.decorator';
import { TableOptions } from 'src/sql-tools/decorators/table.decorator';
import { TriggerOptions } from 'src/sql-tools/decorators/trigger.decorator';
import { UniqueOptions } from 'src/sql-tools/decorators/unique.decorator';
import { DatabaseEnum, DatabaseFunction } from 'src/sql-tools/types';

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
  | { type: 'foreignKeyColumn'; item: PropertyBased<{ options: ForeignKeyColumnOptions; target: () => Function }> }
  | { type: 'foreignKeyConstraint'; item: ClassBased<{ options: ForeignKeyConstraintOptions }> };
export type RegisterItemType<T extends RegisterItem['type']> = Extract<RegisterItem, { type: T }>['item'];
