import { DatabaseSchema, Table, UpdateDateColumn } from 'src/sql-tools';

@Table()
export class Table1 {
  @UpdateDateColumn()
  updatedAt!: string;
}

export const description = 'should register a table with an updated at date column';
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
          name: 'updatedAt',
          tableName: 'table1',
          type: 'timestamp with time zone',
          default: 'now()',
          nullable: false,
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
