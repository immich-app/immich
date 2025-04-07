import { haveEqualColumns } from 'src/sql-tools/helpers';
import {
  CompareFunction,
  Comparer,
  DatabaseCheckConstraint,
  DatabaseConstraint,
  DatabaseConstraintType,
  DatabaseForeignKeyConstraint,
  DatabasePrimaryKeyConstraint,
  DatabaseUniqueConstraint,
  Reason,
  SchemaDiff,
} from 'src/sql-tools/types';

export const compareConstraints: Comparer<DatabaseConstraint> = {
  onMissing: (source) => [
    {
      type: 'constraint.add',
      constraint: source,
      reason: Reason.MissingInTarget,
    },
  ],
  onExtra: (target) => [
    {
      type: 'constraint.drop',
      tableName: target.tableName,
      constraintName: target.name,
      reason: Reason.MissingInSource,
    },
  ],
  onCompare: (source, target) => {
    switch (source.type) {
      case DatabaseConstraintType.PRIMARY_KEY: {
        return comparePrimaryKeyConstraint(source, target as DatabasePrimaryKeyConstraint);
      }

      case DatabaseConstraintType.FOREIGN_KEY: {
        return compareForeignKeyConstraint(source, target as DatabaseForeignKeyConstraint);
      }

      case DatabaseConstraintType.UNIQUE: {
        return compareUniqueConstraint(source, target as DatabaseUniqueConstraint);
      }

      case DatabaseConstraintType.CHECK: {
        return compareCheckConstraint(source, target as DatabaseCheckConstraint);
      }

      default: {
        return [];
      }
    }
  },
};

const comparePrimaryKeyConstraint: CompareFunction<DatabasePrimaryKeyConstraint> = (source, target) => {
  if (!haveEqualColumns(source.columnNames, target.columnNames)) {
    return dropAndRecreateConstraint(
      source,
      target,
      `Primary key columns are different: (${source.columnNames} vs ${target.columnNames})`,
    );
  }

  return [];
};

const compareForeignKeyConstraint: CompareFunction<DatabaseForeignKeyConstraint> = (source, target) => {
  let reason = '';

  const sourceDeleteAction = source.onDelete ?? 'NO ACTION';
  const targetDeleteAction = target.onDelete ?? 'NO ACTION';

  const sourceUpdateAction = source.onUpdate ?? 'NO ACTION';
  const targetUpdateAction = target.onUpdate ?? 'NO ACTION';

  if (!haveEqualColumns(source.columnNames, target.columnNames)) {
    reason = `columns are different (${source.columnNames} vs ${target.columnNames})`;
  } else if (!haveEqualColumns(source.referenceColumnNames, target.referenceColumnNames)) {
    reason = `reference columns are different (${source.referenceColumnNames} vs ${target.referenceColumnNames})`;
  } else if (source.referenceTableName !== target.referenceTableName) {
    reason = `reference table is different (${source.referenceTableName} vs ${target.referenceTableName})`;
  } else if (sourceDeleteAction !== targetDeleteAction) {
    reason = `ON DELETE action is different (${sourceDeleteAction} vs ${targetDeleteAction})`;
  } else if (sourceUpdateAction !== targetUpdateAction) {
    reason = `ON UPDATE action is different (${sourceUpdateAction} vs ${targetUpdateAction})`;
  }

  if (reason) {
    return dropAndRecreateConstraint(source, target, reason);
  }

  return [];
};

const compareUniqueConstraint: CompareFunction<DatabaseUniqueConstraint> = (source, target) => {
  let reason = '';

  if (!haveEqualColumns(source.columnNames, target.columnNames)) {
    reason = `columns are different (${source.columnNames} vs ${target.columnNames})`;
  }

  if (reason) {
    return dropAndRecreateConstraint(source, target, reason);
  }

  return [];
};

const compareCheckConstraint: CompareFunction<DatabaseCheckConstraint> = (source, target) => {
  if (source.expression !== target.expression) {
    // comparing expressions is hard because postgres reconstructs it with different formatting
    // for now if the constraint exists with the same name, we will just skip it
  }

  return [];
};

const dropAndRecreateConstraint = (
  source: DatabaseConstraint,
  target: DatabaseConstraint,
  reason: string,
): SchemaDiff[] => {
  return [
    {
      type: 'constraint.drop',
      tableName: target.tableName,
      constraintName: target.name,
      reason,
    },
    { type: 'constraint.add', constraint: source, reason },
  ];
};
