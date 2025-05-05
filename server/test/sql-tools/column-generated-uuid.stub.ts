import { DatabaseConstraintType, DatabaseSchema, PrimaryGeneratedColumn, Table } from 'src/sql-tools';

@Table()
export class Table1 {
  @PrimaryGeneratedColumn({ strategy: 'uuid' })
  column1!: string;
}

export const description = 'should register a table with a primary generated uuid column';
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
          type: 'uuid',
          default: 'uuid_generate_v4()',
          nullable: false,
          isArray: false,
          primary: true,
          synchronize: true,
        },
      ],
      indexes: [],
      triggers: [],
      constraints: [
        {
          type: DatabaseConstraintType.PRIMARY_KEY,
          name: 'PK_50c4f9905061b1e506d38a2a380',
          tableName: 'table1',
          columnNames: ['column1'],
          synchronize: true,
        },
      ],
      synchronize: true,
    },
  ],
  warnings: [],
};
