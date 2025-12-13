import { Table } from 'src/sql-tools';

@Table({ name: 'table-1' })
@Table({ name: 'table-2' })
export class Table1 {}

export const message = 'Table table-2 has already been registered';
