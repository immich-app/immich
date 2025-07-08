import { DatabaseSchema, Table } from 'src/sql-tools';

@Table()
export class Table1 {}

export const description = 'should register a table with a default name';
export const schema: DatabaseSchema = {
  databaseName: 'postgres',
  schemaName: 'public',
  functions: [],
  enums: [],
  extensions: [],
  parameters: [],
  overrides: [],
  tables: [
    {
      name: 'table1',
      columns: [],
      indexes: [],
      triggers: [],
      constraints: [],
      synchronize: true,
    },
  ],
  warnings: [],
};
