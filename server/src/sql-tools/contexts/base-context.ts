import {
  BaseContextOptions,
  DatabaseEnum,
  DatabaseExtension,
  DatabaseFunction,
  DatabaseOverride,
  DatabaseParameter,
  DatabaseSchema,
  DatabaseTable,
} from 'src/sql-tools/types';

const asOverrideKey = (type: string, name: string) => `${type}:${name}`;

export class BaseContext {
  databaseName: string;
  schemaName: string;
  overrideTableName: string;

  tables: DatabaseTable[] = [];
  functions: DatabaseFunction[] = [];
  enums: DatabaseEnum[] = [];
  extensions: DatabaseExtension[] = [];
  parameters: DatabaseParameter[] = [];
  overrides: DatabaseOverride[] = [];
  warnings: string[] = [];

  constructor(options: BaseContextOptions) {
    this.databaseName = options.databaseName ?? 'postgres';
    this.schemaName = options.schemaName ?? 'public';
    this.overrideTableName = options.overrideTableName ?? 'migration_overrides';
  }

  getTableByName(name: string) {
    return this.tables.find((table) => table.name === name);
  }

  warn(context: string, message: string) {
    this.warnings.push(`[${context}] ${message}`);
  }

  build(): DatabaseSchema {
    const overrideMap = new Map<string, DatabaseOverride>();
    for (const override of this.overrides) {
      const { type, name } = override.value;
      overrideMap.set(asOverrideKey(type, name), override);
    }

    for (const func of this.functions) {
      func.override = overrideMap.get(asOverrideKey('function', func.name));
    }

    for (const { indexes, triggers } of this.tables) {
      for (const index of indexes) {
        index.override = overrideMap.get(asOverrideKey('index', index.name));
      }

      for (const trigger of triggers) {
        trigger.override = overrideMap.get(asOverrideKey('trigger', trigger.name));
      }
    }

    return {
      databaseName: this.databaseName,
      schemaName: this.schemaName,
      tables: this.tables,
      functions: this.functions,
      enums: this.enums,
      extensions: this.extensions,
      parameters: this.parameters,
      overrides: this.overrides,
      warnings: this.warnings,
    };
  }
}
