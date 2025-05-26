import { TagTable } from 'src/schema/tables/tag.table';
import { ForeignKeyColumn, Table } from 'src/sql-tools';

@Table('tags_closure')
export class TagClosureTable {
  @ForeignKeyColumn(() => TagTable, { primary: true, onDelete: 'CASCADE', onUpdate: 'NO ACTION', index: true })
  id_ancestor!: string;

  @ForeignKeyColumn(() => TagTable, { primary: true, onDelete: 'CASCADE', onUpdate: 'NO ACTION', index: true })
  id_descendant!: string;
}
