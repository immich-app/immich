import { Column, DatabaseSchema, Table } from 'src/sql-tools';

const date = new Date(2023, 0, 1);

@Table()
export class Table1 {
  @Column({ type: 'character varying', default: date })
  column1!: string;
}

export const description = 'should register a table with a column with a default value (date)';
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
          default: "'2023-01-01T00:00:00.000Z'",
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
