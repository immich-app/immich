import { BaseContext } from 'src/sql-tools/contexts/base-context';
import { SchemaFromDatabaseOptions } from 'src/sql-tools/types';

export class ReaderContext extends BaseContext {
  constructor(public options: SchemaFromDatabaseOptions) {
    super(options);
  }
}
