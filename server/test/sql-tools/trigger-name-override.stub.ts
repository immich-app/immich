import { DatabaseSchema, Table, Trigger } from 'src/sql-tools';

@Table()
@Trigger({
  name: 'trigger1',
  timing: 'before',
  actions: ['insert'],
  scope: 'row',
  functionName: 'function1',
})
export class Table1 {}

export const description = 'should a trigger with a specific name';
export const schema: DatabaseSchema = {
  name: 'postgres',
  schemaName: 'public',
  functions: [],
  enums: [],
  extensions: [],
  parameters: [],
  tables: [
    {
      name: 'table1',
      columns: [],
      indexes: [],
      triggers: [
        {
          name: 'trigger1',
          tableName: 'table1',
          functionName: 'function1',
          actions: ['insert'],
          scope: 'row',
          timing: 'before',
          synchronize: true,
        },
      ],
      constraints: [],
      synchronize: true,
    },
  ],
  warnings: [],
};
