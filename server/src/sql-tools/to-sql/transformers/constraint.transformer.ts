import { asColumnList } from 'src/sql-tools/helpers';
import { SqlTransformer } from 'src/sql-tools/to-sql/transformers/types';
import { DatabaseActionType, DatabaseConstraint, DatabaseConstraintType, SchemaDiff } from 'src/sql-tools/types';

export const transformConstraints: SqlTransformer = (item: SchemaDiff) => {
  switch (item.type) {
    case 'constraint.add': {
      return asConstraintAdd(item.constraint);
    }

    case 'constraint.drop': {
      return asConstraintDrop(item.tableName, item.constraintName);
    }
    default: {
      return false;
    }
  }
};

const withAction = (constraint: { onDelete?: DatabaseActionType; onUpdate?: DatabaseActionType }) =>
  ` ON UPDATE ${constraint.onUpdate ?? DatabaseActionType.NO_ACTION} ON DELETE ${constraint.onDelete ?? DatabaseActionType.NO_ACTION}`;

export const asConstraintAdd = (constraint: DatabaseConstraint): string | string[] => {
  const base = `ALTER TABLE "${constraint.tableName}" ADD CONSTRAINT "${constraint.name}"`;
  switch (constraint.type) {
    case DatabaseConstraintType.PRIMARY_KEY: {
      const columnNames = asColumnList(constraint.columnNames);
      return `${base} PRIMARY KEY (${columnNames});`;
    }

    case DatabaseConstraintType.FOREIGN_KEY: {
      const columnNames = asColumnList(constraint.columnNames);
      const referenceColumnNames = asColumnList(constraint.referenceColumnNames);
      return (
        `${base} FOREIGN KEY (${columnNames}) REFERENCES "${constraint.referenceTableName}" (${referenceColumnNames})` +
        withAction(constraint) +
        ';'
      );
    }

    case DatabaseConstraintType.UNIQUE: {
      const columnNames = asColumnList(constraint.columnNames);
      return `${base} UNIQUE (${columnNames});`;
    }

    case DatabaseConstraintType.CHECK: {
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
