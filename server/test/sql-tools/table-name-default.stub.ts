import { DatabaseSchema, Table } from 'src/sql-tools';

@Table()
export class Table1 {}

export const description = 'should register a table with a default name';
export const schema: DatabaseSchema = {
  name: 'public',
  tables: [
    {
      name: 'table1',
      columns: [],
      indexes: [],
      constraints: [],
      synchronize: true,
    },
  ],
  warnings: [],
};
