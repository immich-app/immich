import { Column, DatabaseSchema, Index, Table } from 'src/sql-tools';

@Table()
@Index({ name: 'IDX_test', columns: ['id'] })
export class Table1 {
  @Column({ type: 'uuid' })
  id!: string;
}

export const description = 'should create an index with a specific name';
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
          primary: false,
          synchronize: true,
        },
      ],
      indexes: [
        {
          name: 'IDX_test',
          tableName: 'table1',
          unique: false,
          columnNames: ['id'],
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
