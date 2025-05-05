import { Column, ColumnOptions } from 'src/sql-tools/from-code/decorators/column.decorator';

export const PrimaryColumn = (options: Omit<ColumnOptions, 'primary'> = {}) => Column({ ...options, primary: true });
