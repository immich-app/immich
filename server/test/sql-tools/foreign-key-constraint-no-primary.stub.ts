import { Column, DatabaseConstraintType, DatabaseSchema, ForeignKeyConstraint, Table } from 'src/sql-tools';

@Table()
export class Table1 {
  @Column()
  foo!: string;
}

@Table()
@ForeignKeyConstraint({
  columns: ['bar'],
  referenceTable: () => Table1,
  referenceColumns: ['foo'],
})
export class Table2 {
  @Column()
  bar!: string;
}

export const description = 'should create a foreign key constraint to the target table without a primary key';
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
          name: 'foo',
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
    {
      name: 'table2',
      columns: [
        {
          name: 'bar',
          tableName: 'table2',
          type: 'character varying',
          nullable: false,
          isArray: false,
          primary: false,
          synchronize: true,
        },
      ],
      indexes: [
        {
          name: 'IDX_7d9c784c98d12365d198d52e4e',
          tableName: 'table2',
          columnNames: ['bar'],
          unique: false,
          synchronize: true,
        },
      ],
      triggers: [],
      constraints: [
        {
          type: DatabaseConstraintType.FOREIGN_KEY,
          name: 'FK_7d9c784c98d12365d198d52e4e6',
          tableName: 'table2',
          columnNames: ['bar'],
          referenceTableName: 'table1',
          referenceColumnNames: ['foo'],
          synchronize: true,
        },
      ],
      synchronize: true,
    },
  ],
  warnings: [],
};
