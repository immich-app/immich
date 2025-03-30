import { AssetTable } from 'src/schema/tables/asset.table';
import { Column, ColumnIndex, ForeignKeyColumn, Table } from 'src/sql-tools';

@Table({ name: 'smart_search', primaryConstraintName: 'smart_search_pkey' })
export class SmartSearchTable {
  @ForeignKeyColumn(() => AssetTable, {
    onDelete: 'CASCADE',
    primary: true,
    constraintName: 'smart_search_assetId_fkey',
  })
  assetId!: string;

  @ColumnIndex({ name: 'clip_index', synchronize: false })
  @Column({ type: 'vector', array: true, length: 512, synchronize: false })
  embedding!: string;
}
