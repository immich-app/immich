import { Column, DatabaseSchema, Table } from 'src/sql-tools';

@Table()
export class Table1 {
  @Column('column-1')
  column1!: string;
}

export const description = 'should register a table with a column with a specific name';
export const schema: DatabaseSchema = {
  name: 'public',
  tables: [
    {
      name: 'table1',
      columns: [
        {
          name: 'column-1',
          tableName: 'table1',
          type: 'character varying',
          nullable: false,
          isArray: false,
          primary: false,
          synchronize: true,
        },
      ],
      indexes: [],
      constraints: [],
      synchronize: true,
    },
  ],
  warnings: [],
};
