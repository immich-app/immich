import { compareOverrides } from 'src/sql-tools/comparers/override.comparer';
import { DatabaseOverride, Reason } from 'src/sql-tools/types';
import { describe, expect, it } from 'vitest';

const testOverride: DatabaseOverride = {
  name: 'test',
  value: { type: 'function', name: 'test_func', sql: 'func implementation' },
  synchronize: true,
};

describe('compareOverrides', () => {
  describe('onExtra', () => {
    it('should work', () => {
      expect(compareOverrides.onExtra(testOverride)).toEqual([
        {
          type: 'OverrideDrop',
          overrideName: 'test',
          reason: Reason.MissingInSource,
        },
      ]);
    });
  });

  describe('onMissing', () => {
    it('should work', () => {
      expect(compareOverrides.onMissing(testOverride)).toEqual([
        {
          type: 'OverrideCreate',
          override: testOverride,
          reason: Reason.MissingInTarget,
        },
      ]);
    });
  });

  describe('onCompare', () => {
    it('should work', () => {
      expect(compareOverrides.onCompare(testOverride, testOverride)).toEqual([]);
    });

    it('should drop and recreate when the value changes', () => {
      const source: DatabaseOverride = {
        name: 'test',
        value: {
          type: 'function',
          name: 'test_func',
          sql: 'func implementation',
        },
        synchronize: true,
      };
      const target: DatabaseOverride = {
        name: 'test',
        value: {
          type: 'function',
          name: 'test_func',
          sql: 'func implementation2',
        },
        synchronize: true,
      };
      expect(compareOverrides.onCompare(source, target)).toEqual([
        {
          override: source,
          type: 'OverrideUpdate',
          reason: expect.stringContaining('value is different'),
        },
      ]);
    });
  });
});
