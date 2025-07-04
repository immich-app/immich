import { compareFunctions } from 'src/sql-tools/comparers/function.comparer';
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
          type: 'FunctionDrop',
          reason: Reason.MissingInSource,
        },
      ]);
    });
  });

  describe('onMissing', () => {
    it('should work', () => {
      expect(compareFunctions.onMissing(testFunction)).toEqual([
        {
          type: 'FunctionCreate',
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
          type: 'FunctionCreate',
          reason: 'function expression has changed (SELECT 1 vs SELECT 2)',
          function: source,
        },
      ]);
    });
  });
});
