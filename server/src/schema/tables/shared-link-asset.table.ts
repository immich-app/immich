import { AssetTable } from 'src/schema/tables/asset.table';
import { SharedLinkTable } from 'src/schema/tables/shared-link.table';
import { ColumnIndex, ForeignKeyColumn, Table } from 'src/sql-tools';

@Table('shared_link__asset')
export class SharedLinkAssetTable {
  @ColumnIndex()
  @ForeignKeyColumn(() => AssetTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true })
  assetsId!: string;

  @ColumnIndex()
  @ForeignKeyColumn(() => SharedLinkTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true })
  sharedLinksId!: string;
}
