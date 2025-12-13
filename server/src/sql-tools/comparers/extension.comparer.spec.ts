import { compareExtensions } from 'src/sql-tools/comparers/extension.comparer';
import { Reason } from 'src/sql-tools/types';
import { describe, expect, it } from 'vitest';

const testExtension = { name: 'test', synchronize: true };

describe('compareExtensions', () => {
  describe('onExtra', () => {
    it('should work', () => {
      expect(compareExtensions.onExtra(testExtension)).toEqual([
        {
          extensionName: 'test',
          type: 'ExtensionDrop',
          reason: Reason.MissingInSource,
        },
      ]);
    });
  });

  describe('onMissing', () => {
    it('should work', () => {
      expect(compareExtensions.onMissing(testExtension)).toEqual([
        {
          type: 'ExtensionCreate',
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
