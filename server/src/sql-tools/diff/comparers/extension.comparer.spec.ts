import { compareExtensions } from 'src/sql-tools/diff/comparers/extension.comparer';
import { Reason } from 'src/sql-tools/types';
import { describe, expect, it } from 'vitest';

const testExtension = { name: 'test', synchronize: true };

describe('compareExtensions', () => {
  describe('onExtra', () => {
    it('should work', () => {
      expect(compareExtensions.onExtra(testExtension)).toEqual([
        {
          extensionName: 'test',
          type: 'extension.drop',
          reason: Reason.MissingInSource,
        },
      ]);
    });
  });

  describe('onMissing', () => {
    it('should work', () => {
      expect(compareExtensions.onMissing(testExtension)).toEqual([
        {
          type: 'extension.create',
          extension: testExtension,
          reason: Reason.MissingInTarget,
        },
      ]);
    });
  });

  describe('onCompare', () => {
    it('should work', () => {
      expect(compareExtensions.onCompare(testExtension, testExtension)).toEqual([]);
    });
  });
});
