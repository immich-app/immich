import { DatabaseSchema, DeleteDateColumn, Table } from 'src/sql-tools';

@Table()
export class Table1 {
  @DeleteDateColumn()
  deletedAt!: string;
}

export const description = 'should register a table with a deleted at date column';
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
          name: 'deletedAt',
          tableName: 'table1',
          type: 'timestamp with time zone',
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
