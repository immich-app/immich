import { Column, ColumnIndex, DatabaseSchema, Table } from 'src/sql-tools';

@Table()
export class Table1 {
  @ColumnIndex()
  @Column()
  column1!: string;
}

export const description = 'should create a column with an index';
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
        },
      ],
      indexes: [
        {
          name: 'IDX_50c4f9905061b1e506d38a2a38',
          columnNames: ['column1'],
          tableName: 'table1',
          unique: false,
          synchronize: true,
        },
      ],
      constraints: [],
      synchronize: true,
    },
  ],
  warnings: [],
};
