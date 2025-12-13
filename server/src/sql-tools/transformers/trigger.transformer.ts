import { SqlTransformer } from 'src/sql-tools/transformers/types';
import { DatabaseTrigger } from 'src/sql-tools/types';

export const transformTriggers: SqlTransformer = (ctx, item) => {
  switch (item.type) {
    case 'TriggerCreate': {
      return asTriggerCreate(item.trigger);
    }

    case 'TriggerDrop': {
      return asTriggerDrop(item.tableName, item.triggerName);
    }

    default: {
      return false;
    }
  }
};

export const asTriggerCreate = (trigger: DatabaseTrigger): string => {
  const sql: string[] = [
    `CREATE OR REPLACE TRIGGER "${trigger.name}"`,
    `${trigger.timing.toUpperCase()} ${trigger.actions.map((action) => action.toUpperCase()).join(' OR ')} ON "${trigger.tableName}"`,
  ];

  if (trigger.referencingOldTableAs || trigger.referencingNewTableAs) {
    let statement = `REFERENCING`;
    if (trigger.referencingOldTableAs) {
      statement += ` OLD TABLE AS "${trigger.referencingOldTableAs}"`;
    }
    if (trigger.referencingNewTableAs) {
      statement += ` NEW TABLE AS "${trigger.referencingNewTableAs}"`;
    }
    sql.push(statement);
  }

  if (trigger.scope) {
    sql.push(`FOR EACH ${trigger.scope.toUpperCase()}`);
  }

  if (trigger.when) {
    sql.push(`WHEN (${trigger.when})`);
  }

  sql.push(`EXECUTE FUNCTION ${trigger.functionName}();`);

  return sql.join('\n  ');
};

export const asTriggerDrop = (tableName: string, triggerName: string): string => {
  return `DROP TRIGGER "${triggerName}" ON "${tableName}";`;
};
