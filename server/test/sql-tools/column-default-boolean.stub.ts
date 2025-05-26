import { Column, DatabaseSchema, Table } from 'src/sql-tools';

@Table()
export class Table1 {
  @Column({ type: 'boolean', default: true })
  column1!: boolean;
}

export const description = 'should register a table with a column with a default value (boolean)';
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
          type: 'boolean',
          nullable: false,
          isArray: false,
          primary: false,
          synchronize: true,
          default: 'true',
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
