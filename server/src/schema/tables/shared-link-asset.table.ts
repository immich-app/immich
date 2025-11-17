import { AssetTable } from 'src/schema/tables/asset.table';
import { SharedLinkTable } from 'src/schema/tables/shared-link.table';
import { ForeignKeyColumn, Table } from 'src/sql-tools';

@Table('shared_link_asset')
export class SharedLinkAssetTable {
  @ForeignKeyColumn(() => AssetTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true })
  assetId!: string;

  @ForeignKeyColumn(() => SharedLinkTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true })
  sharedLinkId!: string;
}
