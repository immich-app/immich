import { AssetTable } from 'src/schema/tables/asset.table';
import { MemoryTable } from 'src/schema/tables/memory.table';
import { ForeignKeyColumn, Table } from 'src/sql-tools';

@Table('memories_assets_assets')
export class MemoryAssetTable {
  @ForeignKeyColumn(() => MemoryTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true })
  memoriesId!: string;

  @ForeignKeyColumn(() => AssetTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true })
  assetsId!: string;
}
