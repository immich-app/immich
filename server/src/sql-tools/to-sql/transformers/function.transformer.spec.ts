import { transformFunctions } from 'src/sql-tools/to-sql/transformers/function.transformer';
import { describe, expect, it } from 'vitest';

describe(transformFunctions.name, () => {
  describe('function.drop', () => {
    it('should work', () => {
      expect(
        transformFunctions({
          type: 'function.drop',
          functionName: 'test_func',
          reason: 'unknown',
        }),
      ).toEqual(`DROP FUNCTION test_func;`);
    });
  });
});
