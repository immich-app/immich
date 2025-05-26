import { transformConstraints } from 'src/sql-tools/to-sql/transformers/constraint.transformer';
import { DatabaseConstraintType } from 'src/sql-tools/types';
import { describe, expect, it } from 'vitest';

describe(transformConstraints.name, () => {
  describe('constraint.add', () => {
    describe('primary keys', () => {
      it('should work', () => {
        expect(
          transformConstraints({
            type: 'constraint.add',
            constraint: {
              type: DatabaseConstraintType.PRIMARY_KEY,
              name: 'PK_test',
              tableName: 'table1',
              columnNames: ['id'],
              synchronize: true,
            },
            reason: 'unknown',
          }),
        ).toEqual('ALTER TABLE "table1" ADD CONSTRAINT "PK_test" PRIMARY KEY ("id");');
      });
    });

    describe('foreign keys', () => {
      it('should work', () => {
        expect(
          transformConstraints({
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
          }),
        ).toEqual(
          'ALTER TABLE "table1" ADD CONSTRAINT "FK_test" FOREIGN KEY ("parentId") REFERENCES "table2" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;',
        );
      });
    });

    describe('unique', () => {
      it('should work', () => {
        expect(
          transformConstraints({
            type: 'constraint.add',
            constraint: {
              type: DatabaseConstraintType.UNIQUE,
              name: 'UQ_test',
              tableName: 'table1',
              columnNames: ['id'],
              synchronize: true,
            },
            reason: 'unknown',
          }),
        ).toEqual('ALTER TABLE "table1" ADD CONSTRAINT "UQ_test" UNIQUE ("id");');
      });
    });

    describe('check', () => {
      it('should work', () => {
        expect(
          transformConstraints({
            type: 'constraint.add',
            constraint: {
              type: DatabaseConstraintType.CHECK,
              name: 'CHK_test',
              tableName: 'table1',
              expression: '"id" IS NOT NULL',
              synchronize: true,
            },
            reason: 'unknown',
          }),
        ).toEqual('ALTER TABLE "table1" ADD CONSTRAINT "CHK_test" CHECK ("id" IS NOT NULL);');
      });
    });
  });

  describe('constraint.drop', () => {
    it('should work', () => {
      expect(
        transformConstraints({
          type: 'constraint.drop',
          tableName: 'table1',
          constraintName: 'PK_test',
          reason: 'unknown',
        }),
      ).toEqual(`ALTER TABLE "table1" DROP CONSTRAINT "PK_test";`);
    });
  });
});
