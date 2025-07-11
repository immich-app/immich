import { BaseContext } from 'src/sql-tools/contexts/base-context';
import { transformTables } from 'src/sql-tools/transformers/table.transformer';
import { ConstraintType, DatabaseTable } from 'src/sql-tools/types';
import { describe, expect, it } from 'vitest';

const ctx = new BaseContext({});

const table1: DatabaseTable = {
  name: 'table1',
  columns: [
    {
      name: 'column1',
      tableName: 'table1',
      primary: true,
      type: 'character varying',
      nullable: true,
      isArray: false,
      synchronize: true,
    },
    {
      name: 'column2',
      primary: false,
      tableName: 'table1',
      type: 'character varying',
      nullable: true,
      isArray: false,
      synchronize: true,
    },
  ],
  indexes: [
    {
      name: 'index1',
      tableName: 'table1',
      columnNames: ['column2'],
      unique: false,
      synchronize: true,
    },
  ],
  constraints: [
    {
      name: 'constraint1',
      tableName: 'table1',
      columnNames: ['column1'],
      type: ConstraintType.PRIMARY_KEY,
      synchronize: true,
    },
    {
      name: 'constraint2',
      tableName: 'table1',
      columnNames: ['column1'],
      type: ConstraintType.FOREIGN_KEY,
      referenceTableName: 'table2',
      referenceColumnNames: ['parentId'],
      synchronize: true,
    },
    {
      name: 'constraint3',
      tableName: 'table1',
      columnNames: ['column1'],
      type: ConstraintType.UNIQUE,
      synchronize: true,
    },
  ],
  triggers: [],
  synchronize: true,
};

describe(transformTables.name, () => {
  describe('TableDrop', () => {
    it('should work', () => {
      expect(
        transformTables(ctx, {
          type: 'TableDrop',
          tableName: 'table1',
          reason: 'unknown',
        }),
      ).toEqual(`DROP TABLE "table1";`);
    });
  });

  describe('TableCreate', () => {
    it('should work', () => {
      expect(
        transformTables(ctx, {
          type: 'TableCreate',
          table: table1,
          reason: 'unknown',
        }),
      ).toEqual([
        `CREATE TABLE "table1" (
  "column1" character varying,
  "column2" character varying,
  CONSTRAINT "constraint1" PRIMARY KEY ("column1"),
  CONSTRAINT "constraint2" FOREIGN KEY ("column1") REFERENCES "table2" ("parentId") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "constraint3" UNIQUE ("column1")
);`,
        `CREATE INDEX "index1" ON "table1" ("column2");`,
      ]);
    });

    it('should handle a non-nullable column', () => {
      expect(
        transformTables(ctx, {
          type: 'TableCreate',
          table: {
            name: 'table1',
            columns: [
              {
                tableName: 'table1',
                primary: false,
                name: 'column1',
                type: 'character varying',
                isArray: false,
                nullable: false,
                synchronize: true,
              },
            ],
            indexes: [],
            constraints: [],
            triggers: [],
            synchronize: true,
          },
          reason: 'unknown',
        }),
      ).toEqual([
        `CREATE TABLE "table1" (
  "column1" character varying NOT NULL
);`,
      ]);
    });

    it('should handle a default value', () => {
      expect(
        transformTables(ctx, {
          type: 'TableCreate',
          table: {
            name: 'table1',
            columns: [
              {
                tableName: 'table1',
                name: 'column1',
                primary: false,
                type: 'character varying',
                isArray: false,
                nullable: true,
                default: 'uuid_generate_v4()',
                synchronize: true,
              },
            ],
            indexes: [],
            constraints: [],
            triggers: [],
            synchronize: true,
          },
          reason: 'unknown',
        }),
      ).toEqual([
        `CREATE TABLE "table1" (
  "column1" character varying DEFAULT uuid_generate_v4()
);`,
      ]);
    });

    it('should handle a string with a fixed length', () => {
      expect(
        transformTables(ctx, {
          type: 'TableCreate',
          table: {
            name: 'table1',
            columns: [
              {
                tableName: 'table1',
                primary: false,
                name: 'column1',
                type: 'character varying',
                length: 2,
                isArray: false,
                nullable: true,
                synchronize: true,
              },
            ],
            indexes: [],
            constraints: [],
            triggers: [],
            synchronize: true,
          },
          reason: 'unknown',
        }),
      ).toEqual([
        `CREATE TABLE "table1" (
  "column1" character varying(2)
);`,
      ]);
    });

    it('should handle an array type', () => {
      expect(
        transformTables(ctx, {
          type: 'TableCreate',
          table: {
            name: 'table1',
            columns: [
              {
                tableName: 'table1',
                primary: false,
                name: 'column1',
                type: 'character varying',
                isArray: true,
                nullable: true,
                synchronize: true,
              },
            ],
            indexes: [],
            constraints: [],
            triggers: [],
            synchronize: true,
          },
          reason: 'unknown',
        }),
      ).toEqual([
        `CREATE TABLE "table1" (
  "column1" character varying[]
);`,
      ]);
    });
  });
});
