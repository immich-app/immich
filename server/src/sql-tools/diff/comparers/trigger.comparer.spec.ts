import { compareTriggers } from 'src/sql-tools/diff/comparers/trigger.comparer';
import { DatabaseTrigger, Reason } from 'src/sql-tools/types';
import { describe, expect, it } from 'vitest';

const testTrigger: DatabaseTrigger = {
  name: 'test',
  tableName: 'table1',
  timing: 'before',
  actions: ['delete'],
  scope: 'row',
  functionName: 'my_trigger_function',
  synchronize: true,
};

describe('compareTriggers', () => {
  describe('onExtra', () => {
    it('should work', () => {
      expect(compareTriggers.onExtra(testTrigger)).toEqual([
        {
          type: 'trigger.drop',
          tableName: 'table1',
          triggerName: 'test',
          reason: Reason.MissingInSource,
        },
      ]);
    });
  });

  describe('onMissing', () => {
    it('should work', () => {
      expect(compareTriggers.onMissing(testTrigger)).toEqual([
        {
          type: 'trigger.create',
          trigger: testTrigger,
          reason: Reason.MissingInTarget,
        },
      ]);
    });
  });

  describe('onCompare', () => {
    it('should work', () => {
      expect(compareTriggers.onCompare(testTrigger, testTrigger)).toEqual([]);
    });

    it('should detect a change in function name', () => {
      const source: DatabaseTrigger = { ...testTrigger, functionName: 'my_new_name' };
      const target: DatabaseTrigger = { ...testTrigger, functionName: 'my_old_name' };
      const reason = `function is different (my_new_name vs my_old_name)`;
      expect(compareTriggers.onCompare(source, target)).toEqual([{ type: 'trigger.create', trigger: source, reason }]);
    });

    it('should detect a change in actions', () => {
      const source: DatabaseTrigger = { ...testTrigger, actions: ['delete'] };
      const target: DatabaseTrigger = { ...testTrigger, actions: ['delete', 'insert'] };
      const reason = `action is different (delete vs delete,insert)`;
      expect(compareTriggers.onCompare(source, target)).toEqual([{ type: 'trigger.create', trigger: source, reason }]);
    });

    it('should detect a change in timing', () => {
      const source: DatabaseTrigger = { ...testTrigger, timing: 'before' };
      const target: DatabaseTrigger = { ...testTrigger, timing: 'after' };
      const reason = `timing method is different (before vs after)`;
      expect(compareTriggers.onCompare(source, target)).toEqual([{ type: 'trigger.create', trigger: source, reason }]);
    });

    it('should detect a change in scope', () => {
      const source: DatabaseTrigger = { ...testTrigger, scope: 'row' };
      const target: DatabaseTrigger = { ...testTrigger, scope: 'statement' };
      const reason = `scope is different (row vs statement)`;
      expect(compareTriggers.onCompare(source, target)).toEqual([{ type: 'trigger.create', trigger: source, reason }]);
    });

    it('should detect a change in new table reference', () => {
      const source: DatabaseTrigger = { ...testTrigger, referencingNewTableAs: 'new_table' };
      const target: DatabaseTrigger = { ...testTrigger, referencingNewTableAs: undefined };
      const reason = `new table reference is different (new_table vs undefined)`;
      expect(compareTriggers.onCompare(source, target)).toEqual([{ type: 'trigger.create', trigger: source, reason }]);
    });

    it('should detect a change in old table reference', () => {
      const source: DatabaseTrigger = { ...testTrigger, referencingOldTableAs: 'old_table' };
      const target: DatabaseTrigger = { ...testTrigger, referencingOldTableAs: undefined };
      const reason = `old table reference is different (old_table vs undefined)`;
      expect(compareTriggers.onCompare(source, target)).toEqual([{ type: 'trigger.create', trigger: source, reason }]);
    });
  });
});
