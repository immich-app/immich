import { TriggerAction, TriggerScope, TriggerTiming } from 'src/sql-tools/types';

export type NamingItem =
  | {
      type: 'database';
      name: string;
    }
  | {
      type: 'table';
      name: string;
    }
  | {
      type: 'column';
      name: string;
    }
  | {
      type: 'primaryKey';
      tableName: string;
      columnNames: string[];
    }
  | {
      type: 'foreignKey';
      tableName: string;
      columnNames: string[];
      referenceTableName: string;
      referenceColumnNames: string[];
    }
  | {
      type: 'check';
      tableName: string;
      expression: string;
    }
  | {
      type: 'unique';
      tableName: string;
      columnNames: string[];
    }
  | {
      type: 'index';
      tableName: string;
      columnNames?: string[];
      expression?: string;
      where?: string;
    }
  | {
      type: 'trigger';
      tableName: string;
      functionName: string;
      actions: TriggerAction[];
      scope: TriggerScope;
      timing: TriggerTiming;
      columnNames?: string[];
      expression?: string;
      where?: string;
    };

export interface NamingInterface {
  getName(item: NamingItem): string;
}
