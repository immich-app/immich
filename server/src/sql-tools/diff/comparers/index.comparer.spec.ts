import { compareIndexes } from 'src/sql-tools/diff/comparers/index.comparer';
import { DatabaseIndex, Reason } from 'src/sql-tools/types';
import { describe, expect, it } from 'vitest';

const testIndex: DatabaseIndex = {
  name: 'test',
  tableName: 'table1',
  columnNames: ['column1', 'column2'],
  unique: false,
  synchronize: true,
};

describe('compareIndexes', () => {
  describe('onExtra', () => {
    it('should work', () => {
      expect(compareIndexes.onExtra(testIndex)).toEqual([
        {
          type: 'index.drop',
          indexName: 'test',
          reason: Reason.MissingInSource,
        },
      ]);
    });
  });

  describe('onMissing', () => {
    it('should work', () => {
      expect(compareIndexes.onMissing(testIndex)).toEqual([
        {
          type: 'index.create',
          index: testIndex,
          reason: Reason.MissingInTarget,
        },
      ]);
    });
  });

  describe('onCompare', () => {
    it('should work', () => {
      expect(compareIndexes.onCompare(testIndex, testIndex)).toEqual([]);
    });

    it('should drop and recreate when column list is different', () => {
      const source = {
        name: 'test',
        tableName: 'table1',
        columnNames: ['column1'],
        unique: true,
        synchronize: true,
      };
      const target = {
        name: 'test',
        tableName: 'table1',
        columnNames: ['column1', 'column2'],
        unique: true,
        synchronize: true,
      };
      expect(compareIndexes.onCompare(source, target)).toEqual([
        {
          indexName: 'test',
          type: 'index.drop',
          reason: 'columns are different (column1 vs column1,column2)',
        },
        {
          type: 'index.create',
          index: source,
          reason: 'columns are different (column1 vs column1,column2)',
        },
      ]);
    });
  });
});
