import { asColumnList } from 'src/sql-tools/helpers';
import { SqlTransformer } from 'src/sql-tools/transformers/types';
import { ActionType, ConstraintType, DatabaseConstraint } from 'src/sql-tools/types';

export const transformConstraints: SqlTransformer = (ctx, item) => {
  switch (item.type) {
    case 'ConstraintAdd': {
      return `ALTER TABLE "${item.constraint.tableName}" ADD ${asConstraintBody(item.constraint)};`;
    }

    case 'ConstraintRename': {
      return `ALTER TABLE "${item.tableName}" RENAME CONSTRAINT "${item.oldName}" TO "${item.newName}";`;
    }

    case 'ConstraintDrop': {
      return `ALTER TABLE "${item.tableName}" DROP CONSTRAINT "${item.constraintName}";`;
    }
    default: {
      return false;
    }
  }
};

const withAction = (constraint: { onDelete?: ActionType; onUpdate?: ActionType }) =>
  ` ON UPDATE ${constraint.onUpdate ?? ActionType.NO_ACTION} ON DELETE ${constraint.onDelete ?? ActionType.NO_ACTION}`;

export const asConstraintBody = (constraint: DatabaseConstraint): string => {
  const base = `CONSTRAINT "${constraint.name}"`;

  switch (constraint.type) {
    case ConstraintType.PRIMARY_KEY: {
      const columnNames = asColumnList(constraint.columnNames);
      return `${base} PRIMARY KEY (${columnNames})`;
    }

    case ConstraintType.FOREIGN_KEY: {
      const columnNames = asColumnList(constraint.columnNames);
      const referenceColumnNames = asColumnList(constraint.referenceColumnNames);
      return (
        `${base} FOREIGN KEY (${columnNames}) REFERENCES "${constraint.referenceTableName}" (${referenceColumnNames})` +
        withAction(constraint)
      );
    }

    case ConstraintType.UNIQUE: {
      const columnNames = asColumnList(constraint.columnNames);
      return `${base} UNIQUE (${columnNames})`;
    }

    case ConstraintType.CHECK: {
      return `${base} CHECK (${constraint.expression})`;
    }

    default: {
      throw new Error(`Unknown constraint type: ${(constraint as any).type}`);
    }
  }
};
