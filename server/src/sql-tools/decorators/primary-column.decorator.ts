import { Column, ColumnOptions } from 'src/sql-tools/decorators/column.decorator';

export const PrimaryColumn = (options: Omit<ColumnOptions, 'primary'> = {}) => Column({ ...options, primary: true });
