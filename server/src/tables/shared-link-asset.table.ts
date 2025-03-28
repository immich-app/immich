import { ColumnIndex, ForeignKeyColumn, Table } from 'src/sql-tools';
import { AssetTable } from 'src/tables/asset.table';
import { SharedLinkTable } from 'src/tables/shared-link.table';

@Table('shared_link__asset')
export class SharedLinkAssetTable {
  @ColumnIndex()
  @ForeignKeyColumn(() => AssetTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true })
  assetsId!: string;

  @ColumnIndex()
  @ForeignKeyColumn(() => SharedLinkTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true })
  sharedLinksId!: string;
}
