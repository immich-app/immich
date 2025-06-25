import {
  Column,
  DatabaseConstraintType,
  DatabaseSchema,
  ForeignKeyConstraint,
  PrimaryColumn,
  Table,
} from 'src/sql-tools';

@Table()
export class Table1 {
  @PrimaryColumn({ type: 'uuid' })
  id1!: string;

  @PrimaryColumn({ type: 'uuid' })
  id2!: string;
}

@Table()
@ForeignKeyConstraint({ columns: ['parentId1', 'parentId2'], referenceTable: () => Table1 })
export class Table2 {
  @Column({ type: 'uuid' })
  parentId1!: string;

  @Column({ type: 'uuid' })
  parentId2!: string;
}

export const description = 'should create a foreign key constraint to the target table';
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
          name: 'id1',
          tableName: 'table1',
          type: 'uuid',
          nullable: false,
          isArray: false,
          primary: true,
          synchronize: true,
        },
        {
          name: 'id2',
          tableName: 'table1',
          type: 'uuid',
          nullable: false,
          isArray: false,
          primary: true,
          synchronize: true,
        },
      ],
      indexes: [],
      triggers: [],
      constraints: [
        {
          type: DatabaseConstraintType.PRIMARY_KEY,
          name: 'PK_e457e8b1301b7bc06ef78188ee4',
          tableName: 'table1',
          columnNames: ['id1', 'id2'],
          synchronize: true,
        },
      ],
      synchronize: true,
    },
    {
      name: 'table2',
      columns: [
        {
          name: 'parentId1',
          tableName: 'table2',
          type: 'uuid',
          nullable: false,
          isArray: false,
          primary: false,
          synchronize: true,
        },
        {
          name: 'parentId2',
          tableName: 'table2',
          type: 'uuid',
          nullable: false,
          isArray: false,
          primary: false,
          synchronize: true,
        },
      ],
      indexes: [
        {
          name: 'IDX_aed36d04470eba20161aa8b1dc',
          tableName: 'table2',
          columnNames: ['parentId1', 'parentId2'],
          unique: false,
          synchronize: true,
        },
      ],
      triggers: [],
      constraints: [
        {
          type: DatabaseConstraintType.FOREIGN_KEY,
          name: 'FK_aed36d04470eba20161aa8b1dc6',
          tableName: 'table2',
          columnNames: ['parentId1', 'parentId2'],
          referenceColumnNames: ['id1', 'id2'],
          referenceTableName: 'table1',
          synchronize: true,
        },
      ],
      synchronize: true,
    },
  ],
  warnings: [],
};
