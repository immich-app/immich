import { ForeignKeyColumn, Index, Table } from '@immich/sql-tools';
import { AssetTable } from 'src/schema/tables/asset.table';
import { TagTable } from 'src/schema/tables/tag.table';

@Index({ columns: ['assetId', 'tagId'] })
@Table('tag_asset')
export class TagAssetTable {
  @ForeignKeyColumn(() => AssetTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true, index: true })
  assetId!: string;

  @ForeignKeyColumn(() => TagTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true, index: true })
  tagId!: string;
}
