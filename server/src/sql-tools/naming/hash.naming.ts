import { sha1 } from 'src/sql-tools/helpers';
import { DefaultNamingStrategy } from 'src/sql-tools/naming/default.naming';
import { NamingInterface, NamingItem } from 'src/sql-tools/naming/naming.interface';

const fallback = new DefaultNamingStrategy();

const asKey = (prefix: string, tableName: string, values: string[]) =>
  (prefix + sha1(`${tableName}_${values.toSorted().join('_')}`)).slice(0, 30);

export class HashNamingStrategy implements NamingInterface {
  getName(item: NamingItem): string {
    switch (item.type) {
      case 'primaryKey': {
        return asKey('PK_', item.tableName, item.columnNames);
      }

      case 'foreignKey': {
        return asKey('FK_', item.tableName, item.columnNames);
      }

      case 'check': {
        return asKey('CHK_', item.tableName, [item.expression]);
      }

      case 'unique': {
        return asKey('UQ_', item.tableName, item.columnNames);
      }

      case 'index': {
        const items: string[] = [];
        for (const columnName of item.columnNames ?? []) {
          items.push(columnName);
        }

        if (item.where) {
          items.push(item.where);
        }

        return asKey('IDX_', item.tableName, items);
      }

      case 'trigger': {
        return asKey('TR_', item.tableName, [...item.actions, item.scope, item.timing, item.functionName]);
      }

      default: {
        return fallback.getName(item);
      }
    }
  }
}
