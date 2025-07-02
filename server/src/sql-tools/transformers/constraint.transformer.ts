import { asColumnList } from 'src/sql-tools/helpers';
import { SqlTransformer } from 'src/sql-tools/transformers/types';
import { ActionType, ConstraintType, DatabaseConstraint, SchemaDiff } from 'src/sql-tools/types';

export const transformConstraints: SqlTransformer = (item: SchemaDiff) => {
  switch (item.type) {
    case 'ConstraintAdd': {
      return asConstraintAdd(item.constraint);
    }

    case 'ConstraintDrop': {
      return asConstraintDrop(item.tableName, item.constraintName);
    }
    default: {
      return false;
    }
  }
};

const withAction = (constraint: { onDelete?: ActionType; onUpdate?: ActionType }) =>
  ` ON UPDATE ${constraint.onUpdate ?? ActionType.NO_ACTION} ON DELETE ${constraint.onDelete ?? ActionType.NO_ACTION}`;

export const asConstraintAdd = (constraint: DatabaseConstraint): string | string[] => {
  const base = `ALTER TABLE "${constraint.tableName}" ADD CONSTRAINT "${constraint.name}"`;
  switch (constraint.type) {
    case ConstraintType.PRIMARY_KEY: {
      const columnNames = asColumnList(constraint.columnNames);
      return `${base} PRIMARY KEY (${columnNames});`;
    }

    case ConstraintType.FOREIGN_KEY: {
      const columnNames = asColumnList(constraint.columnNames);
      const referenceColumnNames = asColumnList(constraint.referenceColumnNames);
      return (
        `${base} FOREIGN KEY (${columnNames}) REFERENCES "${constraint.referenceTableName}" (${referenceColumnNames})` +
        withAction(constraint) +
        ';'
      );
    }

    case ConstraintType.UNIQUE: {
      const columnNames = asColumnList(constraint.columnNames);
      return `${base} UNIQUE (${columnNames});`;
    }

    case ConstraintType.CHECK: {
      return `${base} CHECK (${constraint.expression});`;
    }

    default: {
      return [];
    }
  }
};

export const asConstraintDrop = (tableName: string, constraintName: string): string => {
  return `ALTER TABLE "${tableName}" DROP CONSTRAINT "${constraintName}";`;
};
