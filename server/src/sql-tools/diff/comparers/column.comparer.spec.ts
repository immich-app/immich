import { compareColumns } from 'src/sql-tools/diff/comparers/column.comparer';
import { DatabaseColumn, Reason } from 'src/sql-tools/types';
import { describe, expect, it } from 'vitest';

const testColumn: DatabaseColumn = {
  name: 'test',
  tableName: 'table1',
  nullable: false,
  isArray: false,
  type: 'character varying',
  synchronize: true,
};

describe('compareColumns', () => {
  describe('onExtra', () => {
    it('should work', () => {
      expect(compareColumns.onExtra(testColumn)).toEqual([
        {
          tableName: 'table1',
          columnName: 'test',
          type: 'column.drop',
          reason: Reason.MissingInSource,
        },
      ]);
    });
  });

  describe('onMissing', () => {
    it('should work', () => {
      expect(compareColumns.onMissing(testColumn)).toEqual([
        {
          type: 'column.add',
          column: testColumn,
          reason: Reason.MissingInTarget,
        },
      ]);
    });
  });

  describe('onCompare', () => {
    it('should work', () => {
      expect(compareColumns.onCompare(testColumn, testColumn)).toEqual([]);
    });

    it('should detect a change in type', () => {
      const source: DatabaseColumn = { ...testColumn };
      const target: DatabaseColumn = { ...testColumn, type: 'text' };
      const reason = 'column type is different (character varying vs text)';
      expect(compareColumns.onCompare(source, target)).toEqual([
        {
          columnName: 'test',
          tableName: 'table1',
          type: 'column.drop',
          reason,
        },
        {
          type: 'column.add',
          column: source,
          reason,
        },
      ]);
    });

    it('should detect a comment change', () => {
      const source: DatabaseColumn = { ...testColumn, comment: 'new comment' };
      const target: DatabaseColumn = { ...testColumn, comment: 'old comment' };
      const reason = 'comment is different (new comment vs old comment)';
      expect(compareColumns.onCompare(source, target)).toEqual([
        {
          columnName: 'test',
          tableName: 'table1',
          type: 'column.alter',
          changes: {
            comment: 'new comment',
          },
          reason,
        },
      ]);
    });
  });
});
