import { DatabaseClient, DatabaseSchema } from 'src/sql-tools/types';

export type DatabaseReader = (schema: DatabaseSchema, db: DatabaseClient) => Promise<void>;
