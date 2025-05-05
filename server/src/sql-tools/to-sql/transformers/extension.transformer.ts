import { SqlTransformer } from 'src/sql-tools/to-sql/transformers/types';
import { DatabaseExtension, SchemaDiff } from 'src/sql-tools/types';

export const transformExtensions: SqlTransformer = (item: SchemaDiff) => {
  switch (item.type) {
    case 'extension.create': {
      return asExtensionCreate(item.extension);
    }

    case 'extension.drop': {
      return asExtensionDrop(item.extensionName);
    }

    default: {
      return false;
    }
  }
};

const asExtensionCreate = (extension: DatabaseExtension): string => {
  return `CREATE EXTENSION IF NOT EXISTS "${extension.name}";`;
};

const asExtensionDrop = (extensionName: string): string => {
  return `DROP EXTENSION "${extensionName}";`;
};
