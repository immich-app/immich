import { SchemaDiff } from 'src/sql-tools/types';

export type SqlTransformer = (item: SchemaDiff) => string | string[] | false;
