import { Kysely } from 'kysely';

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
};

type PostgresYesOrNo = 'YES' | 'NO';

export type ColumnDefaultValue = null | boolean | string | number | object | Date | (() => string);

export type DatabaseClient = Kysely<PostgresDB>;

export enum DatabaseConstraintType {
  PRIMARY_KEY = 'primary-key',
  FOREIGN_KEY = 'foreign-key',
  UNIQUE = 'unique',
  CHECK = 'check',
}

export enum DatabaseActionType {
  NO_ACTION = 'NO ACTION',
  RESTRICT = 'RESTRICT',
  CASCADE = 'CASCADE',
  SET_NULL = 'SET NULL',
  SET_DEFAULT = 'SET DEFAULT',
}

export type DatabaseColumnType =
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

export type TableOptions = {
  name?: string;
  primaryConstraintName?: string;
  synchronize?: boolean;
};

type ColumnBaseOptions = {
  name?: string;
  primary?: boolean;
  type?: DatabaseColumnType;
  nullable?: boolean;
  length?: number;
  default?: ColumnDefaultValue;
  synchronize?: boolean;
};

export type ColumnOptions = ColumnBaseOptions & {
  enum?: object;
  enumName?: string;
  array?: boolean;
  unique?: boolean;
  uniqueConstraintName?: string;
};

export type GenerateColumnOptions = Omit<ColumnOptions, 'type'> & {
  type?: 'v4' | 'v7';
};

export type ColumnIndexOptions = {
  name?: string;
  unique?: boolean;
  expression?: string;
  using?: string;
  where?: string;
  synchronize?: boolean;
};

export type IndexOptions = ColumnIndexOptions & {
  columns?: string[];
  synchronize?: boolean;
};

export type UniqueOptions = {
  name?: string;
  columns: string[];
  synchronize?: boolean;
};

export type CheckOptions = {
  name?: string;
  expression: string;
  synchronize?: boolean;
};

export type DatabaseSchema = {
  name: string;
  tables: DatabaseTable[];
  warnings: string[];
};

export type DatabaseTable = {
  name: string;
  columns: DatabaseColumn[];
  indexes: DatabaseIndex[];
  constraints: DatabaseConstraint[];
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

  type: DatabaseColumnType;
  nullable: boolean;
  isArray: boolean;
  synchronize: boolean;

  default?: string;
  length?: number;

  // enum values
  enumValues?: string[];
  enumName?: string;

  // numeric types
  numericPrecision?: number;
  numericScale?: number;
};

export type DatabaseColumnChanges = {
  nullable?: boolean;
  default?: string;
};

type ColumBasedConstraint = {
  name: string;
  tableName: string;
  columnNames: string[];
};

export type DatabasePrimaryKeyConstraint = ColumBasedConstraint & {
  type: DatabaseConstraintType.PRIMARY_KEY;
  synchronize: boolean;
};

export type DatabaseUniqueConstraint = ColumBasedConstraint & {
  type: DatabaseConstraintType.UNIQUE;
  synchronize: boolean;
};

export type DatabaseForeignKeyConstraint = ColumBasedConstraint & {
  type: DatabaseConstraintType.FOREIGN_KEY;
  referenceTableName: string;
  referenceColumnNames: string[];
  onUpdate?: DatabaseActionType;
  onDelete?: DatabaseActionType;
  synchronize: boolean;
};

export type DatabaseCheckConstraint = {
  type: DatabaseConstraintType.CHECK;
  name: string;
  tableName: string;
  expression: string;
  synchronize: boolean;
};

export type DatabaseIndex = {
  name: string;
  tableName: string;
  columnNames?: string[];
  expression?: string;
  unique: boolean;
  using?: string;
  where?: string;
  synchronize: boolean;
};

export type LoadSchemaOptions = {
  schemaName?: string;
};

export type SchemaDiffToSqlOptions = {
  comments?: boolean;
};

export type SchemaDiff = { reason: string } & (
  | { type: 'table.create'; tableName: string; columns: DatabaseColumn[] }
  | { type: 'table.drop'; tableName: string }
  | { type: 'column.add'; column: DatabaseColumn }
  | { type: 'column.alter'; tableName: string; columnName: string; changes: DatabaseColumnChanges }
  | { type: 'column.drop'; tableName: string; columnName: string }
  | { type: 'constraint.add'; constraint: DatabaseConstraint }
  | { type: 'constraint.drop'; tableName: string; constraintName: string }
  | { type: 'index.create'; index: DatabaseIndex }
  | { type: 'index.drop'; indexName: string }
);

type Action = 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION';
export type ForeignKeyColumnOptions = ColumnBaseOptions & {
  onUpdate?: Action;
  onDelete?: Action;
  constraintName?: string;
  unique?: boolean;
  uniqueConstraintName?: string;
};
