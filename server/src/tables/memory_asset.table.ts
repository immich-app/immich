import { ColumnIndex, ForeignKeyColumn, Table } from 'src/sql-tools';
import { AssetTable } from 'src/tables/asset.table';
import { MemoryTable } from 'src/tables/memory.table';

@Table('memories_assets_assets')
export class MemoryAssetTable {
  @ColumnIndex()
  @ForeignKeyColumn(() => AssetTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true })
  assetsId!: string;

  @ColumnIndex()
  @ForeignKeyColumn(() => MemoryTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true })
  memoriesId!: string;
}
