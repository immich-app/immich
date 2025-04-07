import { Column, DatabaseSchema, registerEnum, Table } from 'src/sql-tools';

enum Test {
  Foo = 'foo',
  Bar = 'bar',
}

const test_enum = registerEnum({ name: 'test_enum', values: Object.values(Test) });

@Table()
export class Table1 {
  @Column({ enum: test_enum })
  column1!: string;
}

export const description = 'should accept an enum type';
export const schema: DatabaseSchema = {
  name: 'postgres',
  schemaName: 'public',
  functions: [],
  enums: [
    {
      name: 'test_enum',
      values: ['foo', 'bar'],
      synchronize: true,
    },
  ],
  extensions: [],
  parameters: [],
  tables: [
    {
      name: 'table1',
      columns: [
        {
          name: 'column1',
          tableName: 'table1',
          type: 'enum',
          enumName: 'test_enum',
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
