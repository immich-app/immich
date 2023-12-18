import { Logger } from 'typeorm';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { format } = require('sql-formatter');

export class SqlLogger implements Logger {
  queries: string[] = [];
  errors: Array<{ error: string | Error; query: string }> = [];

  clear() {
    this.queries = [];
    this.errors = [];
  }

  logQuery(query: string) {
    this.queries.push(format(query, { language: 'postgresql' }));
  }

  logQueryError(error: string | Error, query: string) {
    this.errors.push({ error, query });
  }

  logQuerySlow() {}
  logSchemaBuild() {}
  logMigration() {}
  log() {}
}
