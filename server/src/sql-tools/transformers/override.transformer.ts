import { asJsonString } from 'src/sql-tools/helpers';
import { SqlTransformer } from 'src/sql-tools/transformers/types';
import { DatabaseOverride } from 'src/sql-tools/types';

export const transformOverrides: SqlTransformer = (ctx, item) => {
  const tableName = ctx.overrideTableName;

  switch (item.type) {
    case 'OverrideCreate': {
      return asOverrideCreate(tableName, item.override);
    }

    case 'OverrideUpdate': {
      return asOverrideUpdate(tableName, item.override);
    }

    case 'OverrideDrop': {
      return asOverrideDrop(tableName, item.overrideName);
    }

    default: {
      return false;
    }
  }
};

export const asOverrideCreate = (tableName: string, override: DatabaseOverride): string => {
  return `INSERT INTO "${tableName}" ("name", "value") VALUES ('${override.name}', ${asJsonString(override.value)});`;
};

export const asOverrideUpdate = (tableName: string, override: DatabaseOverride): string => {
  return `UPDATE "${tableName}" SET "value" = ${asJsonString(override.value)} WHERE "name" = '${override.name}';`;
};

export const asOverrideDrop = (tableName: string, overrideName: string): string => {
  return `DELETE FROM "${tableName}" WHERE "name" = '${overrideName}';`;
};
