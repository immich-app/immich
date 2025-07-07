import { BaseContext } from 'src/sql-tools/contexts/base-context';
import { transformExtensions } from 'src/sql-tools/transformers/extension.transformer';
import { describe, expect, it } from 'vitest';

const ctx = new BaseContext({});

describe(transformExtensions.name, () => {
  describe('ExtensionDrop', () => {
    it('should work', () => {
      expect(
        transformExtensions(ctx, {
          type: 'ExtensionDrop',
          extensionName: 'cube',
          reason: 'unknown',
        }),
      ).toEqual(`DROP EXTENSION "cube";`);
    });
  });

  describe('ExtensionCreate', () => {
    it('should work', () => {
      expect(
        transformExtensions(ctx, {
          type: 'ExtensionCreate',
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
