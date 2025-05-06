import { compareEnums } from 'src/sql-tools/diff/comparers/enum.comparer';
import { DatabaseEnum, Reason } from 'src/sql-tools/types';
import { describe, expect, it } from 'vitest';

const testEnum: DatabaseEnum = { name: 'test', values: ['foo', 'bar'], synchronize: true };

describe('compareEnums', () => {
  describe('onExtra', () => {
    it('should work', () => {
      expect(compareEnums.onExtra(testEnum)).toEqual([
        {
          enumName: 'test',
          type: 'enum.drop',
          reason: Reason.MissingInSource,
        },
      ]);
    });
  });

  describe('onMissing', () => {
    it('should work', () => {
      expect(compareEnums.onMissing(testEnum)).toEqual([
        {
          type: 'enum.create',
          enum: testEnum,
          reason: Reason.MissingInTarget,
        },
      ]);
    });
  });

  describe('onCompare', () => {
    it('should work', () => {
      expect(compareEnums.onCompare(testEnum, testEnum)).toEqual([]);
    });

    it('should drop and recreate when values list is different', () => {
      const source = { name: 'test', values: ['foo', 'bar'], synchronize: true };
      const target = { name: 'test', values: ['foo', 'bar', 'world'], synchronize: true };
      expect(compareEnums.onCompare(source, target)).toEqual([
        {
          enumName: 'test',
          type: 'enum.drop',
          reason: 'enum values has changed (foo,bar vs foo,bar,world)',
        },
        {
          type: 'enum.create',
          enum: source,
          reason: 'enum values has changed (foo,bar vs foo,bar,world)',
        },
      ]);
    });
  });
});
