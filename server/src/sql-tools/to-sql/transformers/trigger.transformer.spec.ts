import { transformTriggers } from 'src/sql-tools/to-sql/transformers/trigger.transformer';
import { describe, expect, it } from 'vitest';

describe(transformTriggers.name, () => {
  describe('trigger.create', () => {
    it('should work', () => {
      expect(
        transformTriggers({
          type: 'trigger.create',
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
        transformTriggers({
          type: 'trigger.create',
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
        transformTriggers({
          type: 'trigger.create',
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

  describe('trigger.drop', () => {
    it('should work', () => {
      expect(
        transformTriggers({
          type: 'trigger.drop',
          tableName: 'table1',
          triggerName: 'trigger1',
          reason: 'unknown',
        }),
      ).toEqual(`DROP TRIGGER "trigger1" ON "table1";`);
    });
  });
});
