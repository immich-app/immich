import { BeforeUpdateTrigger, DatabaseSchema, registerFunction, Table } from 'src/sql-tools';

const test_fn = registerFunction({
  name: 'test_fn',
  body: 'SELECT 1;',
  returnType: 'character varying',
});

@Table()
@BeforeUpdateTrigger({
  name: 'my_trigger',
  function: test_fn,
  scope: 'row',
})
export class Table1 {}

export const description = 'should create a trigger ';
export const schema: DatabaseSchema = {
  name: 'postgres',
  schemaName: 'public',
  functions: [expect.any(Object)],
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
          name: 'my_trigger',
          functionName: 'test_fn',
          tableName: 'table1',
          timing: 'before',
          scope: 'row',
          actions: ['update'],
          synchronize: true,
        },
      ],
      constraints: [],
      synchronize: true,
    },
  ],
  warnings: [],
};
