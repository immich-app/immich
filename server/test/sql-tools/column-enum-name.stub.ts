import { Column, DatabaseSchema, Table } from 'src/sql-tools';

enum Test {
  Foo = 'foo',
  Bar = 'bar',
}

@Table()
export class Table1 {
  @Column({ enum: Test })
  column1!: string;
}

export const description = 'should use a default enum naming convention';
export const schema: DatabaseSchema = {
  name: 'public',
  tables: [
    {
      name: 'table1',
      columns: [
        {
          name: 'column1',
          tableName: 'table1',
          type: 'enum',
          enumName: 'table1_column1_enum',
          enumValues: ['foo', 'bar'],
          nullable: false,
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
