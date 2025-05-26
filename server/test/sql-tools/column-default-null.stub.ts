import { Column, DatabaseSchema, Table } from 'src/sql-tools';

@Table()
export class Table1 {
  @Column({ type: 'character varying', default: null })
  column1!: string;
}

export const description = 'should register a nullable column from a default of null';
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
          nullable: true,
          isArray: false,
          primary: false,
          synchronize: true,
        },
      ],
      indexes: [],
      triggers: [],
      constraints: [],
      synchronize: true,
    },
  ],
  warnings: [],
};
