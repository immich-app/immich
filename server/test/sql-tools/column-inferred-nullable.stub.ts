import { Column, DatabaseSchema, Table } from 'src/sql-tools';

@Table()
export class Table1 {
  @Column({ default: null })
  column1!: string;
}

export const description = 'should infer nullable from the default value';
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
      indexes: [],
      constraints: [],
      synchronize: true,
    },
  ],
  warnings: [],
};
