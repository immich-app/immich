import { Column, ConstraintType, DatabaseSchema, Table } from 'src/sql-tools';

@Table()
export class Table1 {
  @Column({ type: 'uuid', unique: true, uniqueConstraintName: 'UQ_test' })
  id!: string;
}

export const description = 'should create a unique key constraint with a specific name';
export const schema: DatabaseSchema = {
  databaseName: 'postgres',
  schemaName: 'public',
  functions: [],
  enums: [],
  extensions: [],
  parameters: [],
  overrides: [],
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
          primary: false,
          synchronize: true,
        },
      ],
      indexes: [],
      triggers: [],
      constraints: [
        {
          type: ConstraintType.UNIQUE,
          name: 'UQ_test',
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
