import { ForeignKeyColumn, Table } from '@immich/sql-tools';
import { TagTable } from 'src/schema/tables/tag.table';

@Table('tag_closure')
export class TagClosureTable {
  @ForeignKeyColumn(() => TagTable, { primary: true, onDelete: 'CASCADE', onUpdate: 'NO ACTION', index: true })
  id_ancestor!: string;

  @ForeignKeyColumn(() => TagTable, { primary: true, onDelete: 'CASCADE', onUpdate: 'NO ACTION', index: true })
  id_descendant!: string;
}
