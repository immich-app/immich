import { DatabaseSchema, Table, Trigger } from 'src/sql-tools';

@Table()
@Trigger({
  timing: 'before',
  actions: ['insert'],
  scope: 'row',
  functionName: 'function1',
})
export class Table1 {}

export const description = 'should register a trigger with a default name';
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
          name: 'TR_ca71832b10b77ed600ef05df631',
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
