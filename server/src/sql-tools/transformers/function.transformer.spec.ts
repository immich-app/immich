import { BaseContext } from 'src/sql-tools/contexts/base-context';
import { transformFunctions } from 'src/sql-tools/transformers/function.transformer';
import { describe, expect, it } from 'vitest';

const ctx = new BaseContext({});

describe(transformFunctions.name, () => {
  describe('FunctionDrop', () => {
    it('should work', () => {
      expect(
        transformFunctions(ctx, {
          type: 'FunctionDrop',
          functionName: 'test_func',
          reason: 'unknown',
        }),
      ).toEqual(`DROP FUNCTION test_func;`);
    });
  });
});
