import { BaseContext } from 'src/sql-tools/contexts/base-context';
import { transformTriggers } from 'src/sql-tools/transformers/trigger.transformer';
import { describe, expect, it } from 'vitest';

const ctx = new BaseContext({});

describe(transformTriggers.name, () => {
  describe('TriggerCreate', () => {
    it('should work', () => {
      expect(
        transformTriggers(ctx, {
          type: 'TriggerCreate',
          trigger: {
            name: 'trigger1',
            tableName: 'table1',
            timing: 'before',
            actions: ['update'],
            scope: 'row',
            functionName: 'function1',
            synchronize: true,
          },
          reason: 'unknown',
        }),
      ).toEqual(
        `CREATE OR REPLACE TRIGGER "trigger1"
  BEFORE UPDATE ON "table1"
  FOR EACH ROW
  EXECUTE FUNCTION function1();`,
      );
    });

    it('should work with multiple actions', () => {
      expect(
        transformTriggers(ctx, {
          type: 'TriggerCreate',
          trigger: {
            name: 'trigger1',
            tableName: 'table1',
            timing: 'before',
            actions: ['update', 'delete'],
            scope: 'row',
            functionName: 'function1',
            synchronize: true,
          },
          reason: 'unknown',
        }),
      ).toEqual(
        `CREATE OR REPLACE TRIGGER "trigger1"
  BEFORE UPDATE OR DELETE ON "table1"
  FOR EACH ROW
  EXECUTE FUNCTION function1();`,
      );
    });

    it('should work with old/new reference table aliases', () => {
      expect(
        transformTriggers(ctx, {
          type: 'TriggerCreate',
          trigger: {
            name: 'trigger1',
            tableName: 'table1',
            timing: 'before',
            actions: ['update'],
            referencingNewTableAs: 'new',
            referencingOldTableAs: 'old',
            scope: 'row',
            functionName: 'function1',
            synchronize: true,
          },
          reason: 'unknown',
        }),
      ).toEqual(
        `CREATE OR REPLACE TRIGGER "trigger1"
  BEFORE UPDATE ON "table1"
  REFERENCING OLD TABLE AS "old" NEW TABLE AS "new"
  FOR EACH ROW
  EXECUTE FUNCTION function1();`,
      );
    });
  });

  describe('TriggerDrop', () => {
    it('should work', () => {
      expect(
        transformTriggers(ctx, {
          type: 'TriggerDrop',
          tableName: 'table1',
          triggerName: 'trigger1',
          reason: 'unknown',
        }),
      ).toEqual(`DROP TRIGGER "trigger1" ON "table1";`);
    });
  });
});
