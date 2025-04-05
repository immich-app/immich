import { Column, DatabaseSchema, Index, Table } from 'src/sql-tools';

@Table()
@Index({ columns: ['id'], where: '"id" IS NOT NULL' })
export class Table1 {
  @Column({ nullable: true })
  column1!: string;
}

export const description = 'should create an index with a where clause';
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
      indexes: [
        {
          name: 'IDX_9f4e073964c0395f51f9b39900',
          tableName: 'table1',
          unique: false,
          columnNames: ['id'],
          where: '"id" IS NOT NULL',
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
