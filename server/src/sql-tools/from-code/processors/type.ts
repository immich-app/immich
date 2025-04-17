import { SchemaFromCodeOptions } from 'src/sql-tools/from-code';
import { TableOptions } from 'src/sql-tools/from-code/decorators/table.decorator';
import { RegisterItem } from 'src/sql-tools/from-code/register-item';
import { DatabaseSchema, DatabaseTable } from 'src/sql-tools/types';

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type TableWithMetadata = DatabaseTable & { metadata: { options: TableOptions; object: Function } };
export type SchemaBuilder = Omit<DatabaseSchema, 'tables'> & { tables: TableWithMetadata[] };

export type Processor = (builder: SchemaBuilder, items: RegisterItem[], options: SchemaFromCodeOptions) => void;
