import { Column, DatabaseSchema, Table } from 'src/sql-tools';

@Table()
export class Table1 {
  @Column({ index: true })
  column1!: string;
}

export const description = 'should create a column with an index';
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
      triggers: [],
      constraints: [],
      synchronize: true,
    },
  ],
  warnings: [],
};
