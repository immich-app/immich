import { Column, DatabaseSchema, Table } from 'src/sql-tools';

@Table()
export class Table1 {
  @Column({ indexName: 'IDX_test' })
  column1!: string;
}

export const description = 'should create a column with an index if a name is provided';
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
          name: 'IDX_test',
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
