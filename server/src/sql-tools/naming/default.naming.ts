import { sha1 } from 'src/sql-tools/helpers';
import { NamingItem } from 'src/sql-tools/naming/naming.interface';

const asSnakeCase = (name: string): string => name.replaceAll(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();

export class DefaultNamingStrategy {
  getName(item: NamingItem): string {
    switch (item.type) {
      case 'database': {
        return asSnakeCase(item.name);
      }

      case 'table': {
        return asSnakeCase(item.name);
      }

      case 'column': {
        return item.name;
      }

      case 'primaryKey': {
        return `${item.tableName}_pkey`;
      }

      case 'foreignKey': {
        return `${item.tableName}_${item.columnNames.join('_')}_fkey`;
      }

      case 'check': {
        return `${item.tableName}_${sha1(item.expression).slice(0, 8)}_chk`;
      }

      case 'unique': {
        return `${item.tableName}_${item.columnNames.join('_')}_uq`;
      }

      case 'index': {
        if (item.columnNames) {
          return `${item.tableName}_${item.columnNames.join('_')}_idx`;
        }

        return `${item.tableName}_${sha1(item.expression || item.where || '').slice(0, 8)}_idx`;
      }

      case 'trigger': {
        return `${item.tableName}_${item.functionName}`;
      }
    }
  }
}
