import { DatabaseConstraintType, schemaDiffToSql } from 'src/sql-tools';
import { describe, expect, it } from 'vitest';

describe('diffToSql', () => {
  describe('extension.drop', () => {
    it('should work', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'extension.drop',
            extensionName: 'cube',
            reason: 'unknown',
          },
        ]),
      ).toEqual([`DROP EXTENSION "cube";`]);
    });
  });

  describe('extension.create', () => {
    it('should work', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'extension.create',
            extension: {
              name: 'cube',
              synchronize: true,
            },
            reason: 'unknown',
          },
        ]),
      ).toEqual([`CREATE EXTENSION IF NOT EXISTS "cube";`]);
    });
  });

  describe('function.drop', () => {
    it('should work', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'function.drop',
            functionName: 'test_func',
            reason: 'unknown',
          },
        ]),
      ).toEqual([`DROP FUNCTION test_func;`]);
    });
  });

  describe('table.drop', () => {
    it('should work', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'table.drop',
            tableName: 'table1',
            reason: 'unknown',
          },
        ]),
      ).toEqual([`DROP TABLE "table1";`]);
    });
  });

  describe('table.create', () => {
    it('should work', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'table.create',
            tableName: 'table1',
            columns: [
              {
                tableName: 'table1',
                name: 'column1',
                type: 'character varying',
                nullable: true,
                isArray: false,
                synchronize: true,
              },
            ],
            reason: 'unknown',
          },
        ]),
      ).toEqual([`CREATE TABLE "table1" ("column1" character varying);`]);
    });

    it('should handle a non-nullable column', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'table.create',
            tableName: 'table1',
            columns: [
              {
                tableName: 'table1',
                name: 'column1',
                type: 'character varying',
                isArray: false,
                nullable: false,
                synchronize: true,
              },
            ],
            reason: 'unknown',
          },
        ]),
      ).toEqual([`CREATE TABLE "table1" ("column1" character varying NOT NULL);`]);
    });

    it('should handle a default value', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'table.create',
            tableName: 'table1',
            columns: [
              {
                tableName: 'table1',
                name: 'column1',
                type: 'character varying',
                isArray: false,
                nullable: true,
                default: 'uuid_generate_v4()',
                synchronize: true,
              },
            ],
            reason: 'unknown',
          },
        ]),
      ).toEqual([`CREATE TABLE "table1" ("column1" character varying DEFAULT uuid_generate_v4());`]);
    });

    it('should handle a string with a fixed length', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'table.create',
            tableName: 'table1',
            columns: [
              {
                tableName: 'table1',
                name: 'column1',
                type: 'character varying',
                length: 2,
                isArray: false,
                nullable: true,
                synchronize: true,
              },
            ],
            reason: 'unknown',
          },
        ]),
      ).toEqual([`CREATE TABLE "table1" ("column1" character varying(2));`]);
    });

    it('should handle an array type', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'table.create',
            tableName: 'table1',
            columns: [
              {
                tableName: 'table1',
                name: 'column1',
                type: 'character varying',
                isArray: true,
                nullable: true,
                synchronize: true,
              },
            ],
            reason: 'unknown',
          },
        ]),
      ).toEqual([`CREATE TABLE "table1" ("column1" character varying[]);`]);
    });
  });

  describe('column.add', () => {
    it('should work', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'column.add',
            column: {
              name: 'column1',
              tableName: 'table1',
              type: 'character varying',
              nullable: false,
              isArray: false,
              synchronize: true,
            },
            reason: 'unknown',
          },
        ]),
      ).toEqual(['ALTER TABLE "table1" ADD "column1" character varying NOT NULL;']);
    });

    it('should add a nullable column', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'column.add',
            column: {
              name: 'column1',
              tableName: 'table1',
              type: 'character varying',
              nullable: true,
              isArray: false,
              synchronize: true,
            },
            reason: 'unknown',
          },
        ]),
      ).toEqual(['ALTER TABLE "table1" ADD "column1" character varying;']);
    });

    it('should add a column with an enum type', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'column.add',
            column: {
              name: 'column1',
              tableName: 'table1',
              type: 'character varying',
              enumName: 'table1_column1_enum',
              nullable: true,
              isArray: false,
              synchronize: true,
            },
            reason: 'unknown',
          },
        ]),
      ).toEqual(['ALTER TABLE "table1" ADD "column1" table1_column1_enum;']);
    });

    it('should add a column that is an array type', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'column.add',
            column: {
              name: 'column1',
              tableName: 'table1',
              type: 'boolean',
              nullable: true,
              isArray: true,
              synchronize: true,
            },
            reason: 'unknown',
          },
        ]),
      ).toEqual(['ALTER TABLE "table1" ADD "column1" boolean[];']);
    });
  });

  describe('column.alter', () => {
    it('should make a column nullable', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'column.alter',
            tableName: 'table1',
            columnName: 'column1',
            changes: { nullable: true },
            reason: 'unknown',
          },
        ]),
      ).toEqual([`ALTER TABLE "table1" ALTER COLUMN "column1" DROP NOT NULL;`]);
    });

    it('should make a column non-nullable', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'column.alter',
            tableName: 'table1',
            columnName: 'column1',
            changes: { nullable: false },
            reason: 'unknown',
          },
        ]),
      ).toEqual([`ALTER TABLE "table1" ALTER COLUMN "column1" SET NOT NULL;`]);
    });

    it('should update the default value', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'column.alter',
            tableName: 'table1',
            columnName: 'column1',
            changes: { default: 'uuid_generate_v4()' },
            reason: 'unknown',
          },
        ]),
      ).toEqual([`ALTER TABLE "table1" ALTER COLUMN "column1" SET DEFAULT uuid_generate_v4();`]);
    });
  });

  describe('column.drop', () => {
    it('should work', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'column.drop',
            tableName: 'table1',
            columnName: 'column1',
            reason: 'unknown',
          },
        ]),
      ).toEqual([`ALTER TABLE "table1" DROP COLUMN "column1";`]);
    });
  });

  describe('constraint.add', () => {
    describe('primary keys', () => {
      it('should work', () => {
        expect(
          schemaDiffToSql([
            {
              type: 'constraint.add',
              constraint: {
                type: DatabaseConstraintType.PRIMARY_KEY,
                name: 'PK_test',
                tableName: 'table1',
                columnNames: ['id'],
                synchronize: true,
              },
              reason: 'unknown',
            },
          ]),
        ).toEqual(['ALTER TABLE "table1" ADD CONSTRAINT "PK_test" PRIMARY KEY ("id");']);
      });
    });

    describe('foreign keys', () => {
      it('should work', () => {
        expect(
          schemaDiffToSql([
            {
              type: 'constraint.add',
              constraint: {
                type: DatabaseConstraintType.FOREIGN_KEY,
                name: 'FK_test',
                tableName: 'table1',
                columnNames: ['parentId'],
                referenceColumnNames: ['id'],
                referenceTableName: 'table2',
                synchronize: true,
              },
              reason: 'unknown',
            },
          ]),
        ).toEqual([
          'ALTER TABLE "table1" ADD CONSTRAINT "FK_test" FOREIGN KEY ("parentId") REFERENCES "table2" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;',
        ]);
      });
    });

    describe('unique', () => {
      it('should work', () => {
        expect(
          schemaDiffToSql([
            {
              type: 'constraint.add',
              constraint: {
                type: DatabaseConstraintType.UNIQUE,
                name: 'UQ_test',
                tableName: 'table1',
                columnNames: ['id'],
                synchronize: true,
              },
              reason: 'unknown',
            },
          ]),
        ).toEqual(['ALTER TABLE "table1" ADD CONSTRAINT "UQ_test" UNIQUE ("id");']);
      });
    });

    describe('check', () => {
      it('should work', () => {
        expect(
          schemaDiffToSql([
            {
              type: 'constraint.add',
              constraint: {
                type: DatabaseConstraintType.CHECK,
                name: 'CHK_test',
                tableName: 'table1',
                expression: '"id" IS NOT NULL',
                synchronize: true,
              },
              reason: 'unknown',
            },
          ]),
        ).toEqual(['ALTER TABLE "table1" ADD CONSTRAINT "CHK_test" CHECK ("id" IS NOT NULL);']);
      });
    });
  });

  describe('constraint.drop', () => {
    it('should work', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'constraint.drop',
            tableName: 'table1',
            constraintName: 'PK_test',
            reason: 'unknown',
          },
        ]),
      ).toEqual([`ALTER TABLE "table1" DROP CONSTRAINT "PK_test";`]);
    });
  });

  describe('index.create', () => {
    it('should work', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'index.create',
            index: {
              name: 'IDX_test',
              tableName: 'table1',
              columnNames: ['column1'],
              unique: false,
              synchronize: true,
            },
            reason: 'unknown',
          },
        ]),
      ).toEqual(['CREATE INDEX "IDX_test" ON "table1" ("column1")']);
    });

    it('should create an unique index', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'index.create',
            index: {
              name: 'IDX_test',
              tableName: 'table1',
              columnNames: ['column1'],
              unique: true,
              synchronize: true,
            },
            reason: 'unknown',
          },
        ]),
      ).toEqual(['CREATE UNIQUE INDEX "IDX_test" ON "table1" ("column1")']);
    });

    it('should create an index with a custom expression', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'index.create',
            index: {
              name: 'IDX_test',
              tableName: 'table1',
              unique: false,
              expression: '"id" IS NOT NULL',
              synchronize: true,
            },
            reason: 'unknown',
          },
        ]),
      ).toEqual(['CREATE INDEX "IDX_test" ON "table1" ("id" IS NOT NULL)']);
    });

    it('should create an index with a where clause', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'index.create',
            index: {
              name: 'IDX_test',
              tableName: 'table1',
              columnNames: ['id'],
              unique: false,
              where: '("id" IS NOT NULL)',
              synchronize: true,
            },
            reason: 'unknown',
          },
        ]),
      ).toEqual(['CREATE INDEX "IDX_test" ON "table1" ("id") WHERE ("id" IS NOT NULL)']);
    });

    it('should create an index with a custom expression', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'index.create',
            index: {
              name: 'IDX_test',
              tableName: 'table1',
              unique: false,
              using: 'gin',
              expression: '"id" IS NOT NULL',
              synchronize: true,
            },
            reason: 'unknown',
          },
        ]),
      ).toEqual(['CREATE INDEX "IDX_test" ON "table1" USING gin ("id" IS NOT NULL)']);
    });
  });

  describe('index.drop', () => {
    it('should work', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'index.drop',
            indexName: 'IDX_test',
            reason: 'unknown',
          },
        ]),
      ).toEqual([`DROP INDEX "IDX_test";`]);
    });
  });

  describe('trigger.create', () => {
    it('should work', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'trigger.create',
            trigger: {
              name: 'trigger1',
              tableName: 'table1',
              timing: 'before',
              actions: ['update'],
              scope: 'row',
              functionName: 'function1',
              synchronize: true,
            },
            reason: 'unknown',
          },
        ]),
      ).toEqual([
        `CREATE OR REPLACE TRIGGER "trigger1"
  BEFORE UPDATE ON "table1"
  FOR EACH ROW
  EXECUTE FUNCTION function1();`,
      ]);
    });

    it('should work with multiple actions', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'trigger.create',
            trigger: {
              name: 'trigger1',
              tableName: 'table1',
              timing: 'before',
              actions: ['update', 'delete'],
              scope: 'row',
              functionName: 'function1',
              synchronize: true,
            },
            reason: 'unknown',
          },
        ]),
      ).toEqual([
        `CREATE OR REPLACE TRIGGER "trigger1"
  BEFORE UPDATE OR DELETE ON "table1"
  FOR EACH ROW
  EXECUTE FUNCTION function1();`,
      ]);
    });

    it('should work with old/new reference table aliases', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'trigger.create',
            trigger: {
              name: 'trigger1',
              tableName: 'table1',
              timing: 'before',
              actions: ['update'],
              referencingNewTableAs: 'new',
              referencingOldTableAs: 'old',
              scope: 'row',
              functionName: 'function1',
              synchronize: true,
            },
            reason: 'unknown',
          },
        ]),
      ).toEqual([
        `CREATE OR REPLACE TRIGGER "trigger1"
  BEFORE UPDATE ON "table1"
  REFERENCING OLD TABLE AS "old" NEW TABLE AS "new"
  FOR EACH ROW
  EXECUTE FUNCTION function1();`,
      ]);
    });
  });

  describe('trigger.drop', () => {
    it('should work', () => {
      expect(
        schemaDiffToSql([
          {
            type: 'trigger.drop',
            tableName: 'table1',
            triggerName: 'trigger1',
            reason: 'unknown',
          },
        ]),
      ).toEqual([`DROP TRIGGER "trigger1" ON "table1";`]);
    });
  });

  describe('comments', () => {
    it('should include the reason in a SQL comment', () => {
      expect(
        schemaDiffToSql(
          [
            {
              type: 'index.drop',
              indexName: 'IDX_test',
              reason: 'unknown',
            },
          ],
          { comments: true },
        ),
      ).toEqual([`DROP INDEX "IDX_test"; -- unknown`]);
    });
  });
});
