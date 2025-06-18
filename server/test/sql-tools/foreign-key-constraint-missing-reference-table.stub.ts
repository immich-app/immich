import { Column, DatabaseSchema, ForeignKeyConstraint, Table } from 'src/sql-tools';

class Foo {}

@Table()
@ForeignKeyConstraint({
  columns: ['parentId'],
  referenceTable: () => Foo,
})
export class Table1 {
  @Column()
  parentId!: string;
}

export const description = 'should warn against missing reference table';
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
          name: 'parentId',
          tableName: 'table1',
          type: 'character varying',
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
  warnings: ['[@ForeignKeyConstraint.referenceTable] Unable to find table (Foo)'],
};
