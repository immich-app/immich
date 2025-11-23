import { AssetTable } from 'src/schema/tables/asset.table';
import { DownloadRequestTable } from 'src/schema/tables/download-request.table';
import { ForeignKeyColumn, Table } from 'src/sql-tools';

@Table('download_request_asset')
export class DownloadRequestAssetTable {
  @ForeignKeyColumn(() => AssetTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true })
  assetId!: string;

  @ForeignKeyColumn(() => DownloadRequestTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true })
  downloadRequestId!: string;
}
