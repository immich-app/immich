import { compareConstraints } from 'src/sql-tools/diff/comparers/constraint.comparer';
import { DatabaseConstraint, DatabaseConstraintType, Reason } from 'src/sql-tools/types';
import { describe, expect, it } from 'vitest';

const testConstraint: DatabaseConstraint = {
  type: DatabaseConstraintType.PRIMARY_KEY,
  name: 'test',
  tableName: 'table1',
  columnNames: ['column1'],
  synchronize: true,
};

describe('compareConstraints', () => {
  describe('onExtra', () => {
    it('should work', () => {
      expect(compareConstraints.onExtra(testConstraint)).toEqual([
        {
          type: 'constraint.drop',
          constraintName: 'test',
          tableName: 'table1',
          reason: Reason.MissingInSource,
        },
      ]);
    });
  });

  describe('onMissing', () => {
    it('should work', () => {
      expect(compareConstraints.onMissing(testConstraint)).toEqual([
        {
          type: 'constraint.add',
          constraint: testConstraint,
          reason: Reason.MissingInTarget,
        },
      ]);
    });
  });

  describe('onCompare', () => {
    it('should work', () => {
      expect(compareConstraints.onCompare(testConstraint, testConstraint)).toEqual([]);
    });

    it('should detect a change in type', () => {
      const source: DatabaseConstraint = { ...testConstraint };
      const target: DatabaseConstraint = { ...testConstraint, columnNames: ['column1', 'column2'] };
      const reason = 'Primary key columns are different: (column1 vs column1,column2)';
      expect(compareConstraints.onCompare(source, target)).toEqual([
        {
          constraintName: 'test',
          tableName: 'table1',
          type: 'constraint.drop',
          reason,
        },
        {
          type: 'constraint.add',
          constraint: source,
          reason,
        },
      ]);
    });
  });
});
