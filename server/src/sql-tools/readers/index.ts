import { readColumns } from 'src/sql-tools/readers/column.reader';
import { readComments } from 'src/sql-tools/readers/comment.reader';
import { readConstraints } from 'src/sql-tools/readers/constraint.reader';
import { readExtensions } from 'src/sql-tools/readers/extension.reader';
import { readFunctions } from 'src/sql-tools/readers/function.reader';
import { readIndexes } from 'src/sql-tools/readers/index.reader';
import { readName } from 'src/sql-tools/readers/name.reader';
import { readOverrides } from 'src/sql-tools/readers/override.reader';
import { readParameters } from 'src/sql-tools/readers/parameter.reader';
import { readTables } from 'src/sql-tools/readers/table.reader';
import { readTriggers } from 'src/sql-tools/readers/trigger.reader';
import { Reader } from 'src/sql-tools/types';

export const readers: Reader[] = [
  readName,
  readParameters,
  readExtensions,
  readFunctions,
  readTables,
  readColumns,
  readIndexes,
  readConstraints,
  readTriggers,
  readComments,
  readOverrides,
];
