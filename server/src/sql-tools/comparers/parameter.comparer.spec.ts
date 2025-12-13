import { compareParameters } from 'src/sql-tools/comparers/parameter.comparer';
import { DatabaseParameter, Reason } from 'src/sql-tools/types';
import { describe, expect, it } from 'vitest';

const testParameter: DatabaseParameter = {
  name: 'test',
  databaseName: 'immich',
  value: 'on',
  scope: 'database',
  synchronize: true,
};

describe('compareParameters', () => {
  describe('onExtra', () => {
    it('should work', () => {
      expect(compareParameters.onExtra(testParameter)).toEqual([
        {
          type: 'ParameterReset',
          databaseName: 'immich',
          parameterName: 'test',
          reason: Reason.MissingInSource,
        },
      ]);
    });
  });

  describe('onMissing', () => {
    it('should work', () => {
      expect(compareParameters.onMissing(testParameter)).toEqual([
        {
          type: 'ParameterSet',
          parameter: testParameter,
          reason: Reason.MissingInTarget,
        },
      ]);
    });
  });

  describe('onCompare', () => {
    it('should work', () => {
      expect(compareParameters.onCompare(testParameter, testParameter)).toEqual([]);
    });
  });
});
