import { Kysely, ColumnType as KyselyColumnType } from 'kysely';
import { RegisterItem } from 'src/sql-tools/register-item';
import { SchemaBuilder } from 'src/sql-tools/schema-builder';

export type SchemaFromCodeOptions = {
  /** automatically create indexes on foreign key columns */
  createForeignKeyIndexes?: boolean;
  databaseName?: string;
  schemaName?: string;
  reset?: boolean;
};

export type SchemaFromDatabaseOptions = {
  schemaName?: string;
};

export type SchemaDiffToSqlOptions = {
  comments?: boolean;
};

export type SchemaDiffOptions = {
  tables?: IgnoreOptions;
  functions?: IgnoreOptions;
  enums?: IgnoreOptions;
  extension?: IgnoreOptions;
  parameters?: IgnoreOptions;
};

export type IgnoreOptions = {
  ignoreExtra?: boolean;
  ignoreMissing?: boolean;
};

export type Processor = (builder: SchemaBuilder, items: RegisterItem[], options: SchemaFromCodeOptions) => void;
export type DatabaseReader = (schema: DatabaseSchema, db: DatabaseClient) => Promise<void>;

export type PostgresDB = {
  pg_am: {
    oid: number;
    amname: string;
    amhandler: string;
    amtype: string;
  };

  pg_attribute: {
    attrelid: number;
    attname: string;
    attnum: number;
    atttypeid: number;
    attstattarget: number;
    attstatarget: number;
    aanum: number;
  };

  pg_class: {
    oid: number;
    relname: string;
    relkind: string;
    relnamespace: string;
    reltype: string;
    relowner: string;
    relam: string;
    relfilenode: string;
    reltablespace: string;
    relpages: number;
    reltuples: number;
    relallvisible: number;
    reltoastrelid: string;
    relhasindex: PostgresYesOrNo;
    relisshared: PostgresYesOrNo;
    relpersistence: string;
  };

  pg_constraint: {
    oid: number;
    conname: string;
    conrelid: string;
    contype: string;
    connamespace: string;
    conkey: number[];
    confkey: number[];
    confrelid: string;
    confupdtype: string;
    confdeltype: string;
    confmatchtype: number;
    condeferrable: PostgresYesOrNo;
    condeferred: PostgresYesOrNo;
    convalidated: PostgresYesOrNo;
    conindid: number;
  };

  pg_description: {
    objoid: string;
    classoid: string;
    objsubid: number;
    description: string;
  };

  pg_trigger: {
    oid: string;
    tgisinternal: boolean;
    tginitdeferred: boolean;
    tgdeferrable: boolean;
    tgrelid: string;
    tgfoid: string;
    tgname: string;
    tgenabled: string;
    tgtype: number;
    tgconstraint: string;
    tgdeferred: boolean;
    tgargs: Buffer;
    tgoldtable: string;
    tgnewtable: string;
    tgqual: string;
  };

  'pg_catalog.pg_extension': {
    oid: string;
    extname: string;
    extowner: string;
    extnamespace: string;
    extrelocatable: boolean;
    extversion: string;
    extconfig: string[];
    extcondition: string[];
  };

  pg_enum: {
    oid: string;
    enumtypid: string;
    enumsortorder: number;
    enumlabel: string;
  };

  pg_index: {
    indexrelid: string;
    indrelid: string;
    indisready: boolean;
    indexprs: string | null;
    indpred: string | null;
    indkey: number[];
    indisprimary: boolean;
    indisunique: boolean;
  };

  pg_indexes: {
    schemaname: string;
    tablename: string;
    indexname: string;
    tablespace: string | null;
    indexrelid: string;
    indexdef: string;
  };

  pg_namespace: {
    oid: number;
    nspname: string;
    nspowner: number;
    nspacl: string[];
  };

  pg_type: {
    oid: string;
    typname: string;
    typnamespace: string;
    typowner: string;
    typtype: string;
    typcategory: string;
    typarray: string;
  };

  pg_depend: {
    objid: string;
    deptype: string;
  };

  pg_proc: {
    oid: string;
    proname: string;
    pronamespace: string;
    prokind: string;
  };

  pg_settings: {
    name: string;
    setting: string;
    unit: string | null;
    category: string;
    short_desc: string | null;
    extra_desc: string | null;
    context: string;
    vartype: string;
    source: string;
    min_val: string | null;
    max_val: string | null;
    enumvals: string[] | null;
    boot_val: string | null;
    reset_val: string | null;
    sourcefile: string | null;
    sourceline: number | null;
    pending_restart: PostgresYesOrNo;
  };

  'information_schema.tables': {
    table_catalog: string;
    table_schema: string;
    table_name: string;
    table_type: 'VIEW' | 'BASE TABLE' | string;
    is_insertable_info: PostgresYesOrNo;
    is_typed: PostgresYesOrNo;
    commit_action: string | null;
  };

  'information_schema.columns': {
    table_catalog: string;
    table_schema: string;
    table_name: string;
    column_name: string;
    ordinal_position: number;
    column_default: string | null;
    is_nullable: PostgresYesOrNo;
    data_type: string;
    dtd_identifier: string;
    character_maximum_length: number | null;
    character_octet_length: number | null;
    numeric_precision: number | null;
    numeric_precision_radix: number | null;
    numeric_scale: number | null;
    datetime_precision: number | null;
    interval_type: string | null;
    interval_precision: number | null;
    udt_catalog: string;
    udt_schema: string;
    udt_name: string;
    maximum_cardinality: number | null;
    is_updatable: PostgresYesOrNo;
  };

  'information_schema.element_types': {
    object_catalog: string;
    object_schema: string;
    object_name: string;
    object_type: string;
    collection_type_identifier: string;
    data_type: string;
  };

  'information_schema.routines': {
    specific_catalog: string;
    specific_schema: string;
    specific_name: string;
    routine_catalog: string;
    routine_schema: string;
    routine_name: string;
    routine_type: string;
    data_type: string;
    type_udt_catalog: string;
    type_udt_schema: string;
    type_udt_name: string;
    dtd_identifier: string;
    routine_body: string;
    routine_definition: string;
    external_name: string;
    external_language: string;
    is_deterministic: PostgresYesOrNo;
    security_type: string;
  };
};

type PostgresYesOrNo = 'YES' | 'NO';

export type DatabaseClient = Kysely<PostgresDB>;

export enum ConstraintType {
  PRIMARY_KEY = 'primary-key',
  FOREIGN_KEY = 'foreign-key',
  UNIQUE = 'unique',
  CHECK = 'check',
}

export enum ActionType {
  NO_ACTION = 'NO ACTION',
  RESTRICT = 'RESTRICT',
  CASCADE = 'CASCADE',
  SET_NULL = 'SET NULL',
  SET_DEFAULT = 'SET DEFAULT',
}

export type ColumnStorage = 'default' | 'external' | 'extended' | 'main';

export type ColumnType =
  | 'bigint'
  | 'boolean'
  | 'bytea'
  | 'character'
  | 'character varying'
  | 'date'
  | 'double precision'
  | 'integer'
  | 'jsonb'
  | 'polygon'
  | 'text'
  | 'time'
  | 'time with time zone'
  | 'time without time zone'
  | 'timestamp'
  | 'timestamp with time zone'
  | 'timestamp without time zone'
  | 'uuid'
  | 'vector'
  | 'enum'
  | 'serial';

export type DatabaseSchema = {
  databaseName: string;
  schemaName: string;
  functions: DatabaseFunction[];
  enums: DatabaseEnum[];
  tables: DatabaseTable[];
  extensions: DatabaseExtension[];
  parameters: DatabaseParameter[];
  warnings: string[];
};

export type DatabaseParameter = {
  name: string;
  databaseName: string;
  value: string | number | null | undefined;
  scope: ParameterScope;
  synchronize: boolean;
};

export type ParameterScope = 'database' | 'user';

export type DatabaseEnum = {
  name: string;
  values: string[];
  synchronize: boolean;
};

export type DatabaseFunction = {
  name: string;
  expression: string;
  synchronize: boolean;
};

export type DatabaseExtension = {
  name: string;
  synchronize: boolean;
};

export type DatabaseTable = {
  name: string;
  columns: DatabaseColumn[];
  indexes: DatabaseIndex[];
  constraints: DatabaseConstraint[];
  triggers: DatabaseTrigger[];
  synchronize: boolean;
};

export type DatabaseConstraint =
  | DatabasePrimaryKeyConstraint
  | DatabaseForeignKeyConstraint
  | DatabaseUniqueConstraint
  | DatabaseCheckConstraint;

export type DatabaseColumn = {
  primary?: boolean;
  name: string;
  tableName: string;
  comment?: string;

  type: ColumnType;
  nullable: boolean;
  isArray: boolean;
  synchronize: boolean;

  default?: string;
  length?: number;
  storage?: ColumnStorage;
  identity?: boolean;

  // enum values
  enumName?: string;

  // numeric types
  numericPrecision?: number;
  numericScale?: number;
};

export type ColumnChanges = {
  nullable?: boolean;
  default?: string;
  comment?: string;
  storage?: ColumnStorage;
};

type ColumBasedConstraint = {
  name: string;
  tableName: string;
  columnNames: string[];
};

export type DatabasePrimaryKeyConstraint = ColumBasedConstraint & {
  type: ConstraintType.PRIMARY_KEY;
  synchronize: boolean;
};

export type DatabaseUniqueConstraint = ColumBasedConstraint & {
  type: ConstraintType.UNIQUE;
  synchronize: boolean;
};

export type DatabaseForeignKeyConstraint = ColumBasedConstraint & {
  type: ConstraintType.FOREIGN_KEY;
  referenceTableName: string;
  referenceColumnNames: string[];
  onUpdate?: ActionType;
  onDelete?: ActionType;
  synchronize: boolean;
};

export type DatabaseCheckConstraint = {
  type: ConstraintType.CHECK;
  name: string;
  tableName: string;
  expression: string;
  synchronize: boolean;
};

export type DatabaseTrigger = {
  name: string;
  tableName: string;
  timing: TriggerTiming;
  actions: TriggerAction[];
  scope: TriggerScope;
  referencingNewTableAs?: string;
  referencingOldTableAs?: string;
  when?: string;
  functionName: string;
  synchronize: boolean;
};
export type TriggerTiming = 'before' | 'after' | 'instead of';
export type TriggerAction = 'insert' | 'update' | 'delete' | 'truncate';
export type TriggerScope = 'row' | 'statement';

export type DatabaseIndex = {
  name: string;
  tableName: string;
  columnNames?: string[];
  expression?: string;
  unique: boolean;
  using?: string;
  with?: string;
  where?: string;
  synchronize: boolean;
};

export type SchemaDiff = { reason: string } & (
  | { type: 'ExtensionCreate'; extension: DatabaseExtension }
  | { type: 'ExtensionDrop'; extensionName: string }
  | { type: 'FunctionCreate'; function: DatabaseFunction }
  | { type: 'FunctionDrop'; functionName: string }
  | { type: 'TableCreate'; table: DatabaseTable }
  | { type: 'TableDrop'; tableName: string }
  | { type: 'ColumnAdd'; column: DatabaseColumn }
  | { type: 'ColumnAlter'; tableName: string; columnName: string; changes: ColumnChanges }
  | { type: 'ColumnDrop'; tableName: string; columnName: string }
  | { type: 'ConstraintAdd'; constraint: DatabaseConstraint }
  | { type: 'ConstraintDrop'; tableName: string; constraintName: string }
  | { type: 'IndexCreate'; index: DatabaseIndex }
  | { type: 'IndexDrop'; indexName: string }
  | { type: 'TriggerCreate'; trigger: DatabaseTrigger }
  | { type: 'TriggerDrop'; tableName: string; triggerName: string }
  | { type: 'ParameterSet'; parameter: DatabaseParameter }
  | { type: 'ParameterReset'; databaseName: string; parameterName: string }
  | { type: 'EnumCreate'; enum: DatabaseEnum }
  | { type: 'EnumDrop'; enumName: string }
);

export type CompareFunction<T> = (source: T, target: T) => SchemaDiff[];
export type Comparer<T> = {
  onMissing: (source: T) => SchemaDiff[];
  onExtra: (target: T) => SchemaDiff[];
  onCompare: CompareFunction<T>;
};

export enum Reason {
  MissingInSource = 'missing in source',
  MissingInTarget = 'missing in target',
}

export type Timestamp = KyselyColumnType<Date, Date | string, Date | string>;
export type Generated<T> =
  T extends KyselyColumnType<infer S, infer I, infer U>
    ? KyselyColumnType<S, I | undefined, U>
    : KyselyColumnType<T, T | undefined, T>;
export type Int8 = KyselyColumnType<number>;
