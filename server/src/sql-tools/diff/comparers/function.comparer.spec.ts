import { compareFunctions } from 'src/sql-tools/diff/comparers/function.comparer';
import { DatabaseFunction, Reason } from 'src/sql-tools/types';
import { describe, expect, it } from 'vitest';

const testFunction: DatabaseFunction = {
  name: 'test',
  expression: 'CREATE FUNCTION something something something',
  synchronize: true,
};

describe('compareFunctions', () => {
  describe('onExtra', () => {
    it('should work', () => {
      expect(compareFunctions.onExtra(testFunction)).toEqual([
        {
          functionName: 'test',
          type: 'function.drop',
          reason: Reason.MissingInSource,
        },
      ]);
    });
  });

  describe('onMissing', () => {
    it('should work', () => {
      expect(compareFunctions.onMissing(testFunction)).toEqual([
        {
          type: 'function.create',
          function: testFunction,
          reason: Reason.MissingInTarget,
        },
      ]);
    });
  });

  describe('onCompare', () => {
    it('should ignore functions with the same hash', () => {
      expect(compareFunctions.onCompare(testFunction, testFunction)).toEqual([]);
    });

    it('should report differences if functions have different hashes', () => {
      const source: DatabaseFunction = { ...testFunction, expression: 'SELECT 1' };
      const target: DatabaseFunction = { ...testFunction, expression: 'SELECT 2' };
      expect(compareFunctions.onCompare(source, target)).toEqual([
        {
          type: 'function.create',
          reason: 'function expression has changed (SELECT 1 vs SELECT 2)',
          function: source,
        },
      ]);
    });
  });
});
