import { DatabaseConstraintType, DatabaseSchema, PrimaryColumn, Table } from 'src/sql-tools';

@Table({ primaryConstraintName: 'PK_test' })
export class Table1 {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;
}

export const description = 'should add a primary key constraint to the table with a specific name';
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
          name: 'id',
          tableName: 'table1',
          type: 'uuid',
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
          name: 'PK_test',
          tableName: 'table1',
          columnNames: ['id'],
          synchronize: true,
        },
      ],
      synchronize: true,
    },
  ],
  warnings: [],
};
