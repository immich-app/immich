import { Column, DatabaseSchema, Table } from 'src/sql-tools';

@Table()
export class Table1 {
  @Column({ type: 'character varying', default: 'foo' })
  column1!: string;
}

export const description = 'should register a table with a column with a default value (string)';
export const schema: DatabaseSchema = {
  name: 'public',
  tables: [
    {
      name: 'table1',
      columns: [
        {
          name: 'column1',
          tableName: 'table1',
          type: 'character varying',
          nullable: false,
          isArray: false,
          primary: false,
          synchronize: true,
          default: "'foo'",
        },
      ],
      indexes: [],
      constraints: [],
      synchronize: true,
    },
  ],
  warnings: [],
};
