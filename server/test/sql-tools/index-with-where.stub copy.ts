import { Column, DatabaseSchema, Index, Table } from 'src/sql-tools';

@Table()
@Index({ expression: '"id" IS NOT NULL' })
export class Table1 {
  @Column({ nullable: true })
  column1!: string;
}

export const description = 'should create an index based off of an expression';
export const schema: DatabaseSchema = {
  name: 'public',
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
          name: 'IDX_376788d186160c4faa5aaaef63',
          tableName: 'table1',
          unique: false,
          expression: '"id" IS NOT NULL',
          synchronize: true,
        },
      ],
      constraints: [],
      synchronize: true,
    },
  ],
  warnings: [],
};
