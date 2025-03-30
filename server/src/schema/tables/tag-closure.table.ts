import { TagTable } from 'src/schema/tables/tag.table';
import { ColumnIndex, ForeignKeyColumn, PrimaryColumn, Table } from 'src/sql-tools';

@Table('tags_closure')
export class TagClosureTable {
  @PrimaryColumn()
  @ColumnIndex()
  @ForeignKeyColumn(() => TagTable, { onDelete: 'CASCADE', onUpdate: 'NO ACTION' })
  id_ancestor!: string;

  @PrimaryColumn()
  @ColumnIndex()
  @ForeignKeyColumn(() => TagTable, { onDelete: 'CASCADE', onUpdate: 'NO ACTION' })
  id_descendant!: string;
}
