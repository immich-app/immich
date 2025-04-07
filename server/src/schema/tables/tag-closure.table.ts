import { TagTable } from 'src/schema/tables/tag.table';
import { ColumnIndex, ForeignKeyColumn, Table } from 'src/sql-tools';

@Table('tags_closure')
export class TagClosureTable {
  @ColumnIndex()
  @ForeignKeyColumn(() => TagTable, { primary: true, onDelete: 'CASCADE', onUpdate: 'NO ACTION' })
  id_ancestor!: string;

  @ColumnIndex()
  @ForeignKeyColumn(() => TagTable, { primary: true, onDelete: 'CASCADE', onUpdate: 'NO ACTION' })
  id_descendant!: string;
}
