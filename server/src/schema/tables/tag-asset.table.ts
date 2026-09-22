import { ForeignKeyColumn, Index, Table } from '@immich/sql-tools';
import { AssetTable } from 'src/schema/tables/asset.table.js';
import { TagTable } from 'src/schema/tables/tag.table.js';

@Index({ columns: ['assetId', 'tagId'] })
@Table('tag_asset')
export class TagAssetTable {
  @ForeignKeyColumn(() => AssetTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true, index: true })
  assetId!: string;

  @ForeignKeyColumn(() => TagTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true, index: true })
  tagId!: string;
}
