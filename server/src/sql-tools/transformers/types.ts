import { BaseContext } from 'src/sql-tools/contexts/base-context';
import { SchemaDiff } from 'src/sql-tools/types';

export type SqlTransformer = (ctx: BaseContext, item: SchemaDiff) => string | string[] | false;
