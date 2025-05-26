import { transformExtensions } from 'src/sql-tools/to-sql/transformers/extension.transformer';
import { describe, expect, it } from 'vitest';

describe(transformExtensions.name, () => {
  describe('extension.drop', () => {
    it('should work', () => {
      expect(
        transformExtensions({
          type: 'extension.drop',
          extensionName: 'cube',
          reason: 'unknown',
        }),
      ).toEqual(`DROP EXTENSION "cube";`);
    });
  });

  describe('extension.create', () => {
    it('should work', () => {
      expect(
        transformExtensions({
          type: 'extension.create',
          extension: {
            name: 'cube',
            synchronize: true,
          },
          reason: 'unknown',
        }),
      ).toEqual(`CREATE EXTENSION IF NOT EXISTS "cube";`);
    });
  });
});
