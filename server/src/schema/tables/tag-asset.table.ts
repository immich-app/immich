import { AssetTable } from 'src/schema/tables/asset.table';
import { TagTable } from 'src/schema/tables/tag.table';
import { ColumnIndex, ForeignKeyColumn, Index, Table } from 'src/sql-tools';

@Index({ name: 'IDX_tag_asset_assetsId_tagsId', columns: ['assetsId', 'tagsId'] })
@Table('tag_asset')
export class TagAssetTable {
  @ColumnIndex()
  @ForeignKeyColumn(() => AssetTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true })
  assetsId!: string;

  @ColumnIndex()
  @ForeignKeyColumn(() => TagTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true })
  tagsId!: string;
}
