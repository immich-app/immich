import { transformFunctions } from 'src/sql-tools/transformers/function.transformer';
import { describe, expect, it } from 'vitest';

describe(transformFunctions.name, () => {
  describe('FunctionDrop', () => {
    it('should work', () => {
      expect(
        transformFunctions({
          type: 'FunctionDrop',
          functionName: 'test_func',
          reason: 'unknown',
        }),
      ).toEqual(`DROP FUNCTION test_func;`);
    });
  });
});
