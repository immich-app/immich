import { Column, DatabaseSchema, Table } from 'src/sql-tools';

@Table()
export class Table1 {
  @Column({ type: 'integer', default: 0 })
  column1!: string;
}

export const description = 'should register a table with a column with a default value (number)';
export const schema: DatabaseSchema = {
  name: 'public',
  tables: [
    {
      name: 'table1',
      columns: [
        {
          name: 'column1',
          tableName: 'table1',
          type: 'integer',
          nullable: false,
          isArray: false,
          primary: false,
          synchronize: true,
          default: '0',
        },
      ],
      indexes: [],
      constraints: [],
      synchronize: true,
    },
  ],
  warnings: [],
};
