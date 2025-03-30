import { DatabaseConstraintType, DatabaseSchema, PrimaryColumn, Table } from 'src/sql-tools';

@Table()
export class Table1 {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;
}

export const description = 'should add a primary key constraint to the table with a default name';
export const schema: DatabaseSchema = {
  name: 'public',
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
      constraints: [
        {
          type: DatabaseConstraintType.PRIMARY_KEY,
          name: 'PK_b249cc64cf63b8a22557cdc8537',
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
