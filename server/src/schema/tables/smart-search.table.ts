import { AssetTable } from 'src/schema/tables/asset.table';
import { Column, ForeignKeyColumn, Index, Table } from 'src/sql-tools';

@Table({ name: 'smart_search', primaryConstraintName: 'smart_search_pkey' })
@Index({
  name: 'clip_index',
  using: 'hnsw',
  expression: `embedding vector_cosine_ops`,
  with: `ef_construction = 300, m = 16`,
  synchronize: false,
})
export class SmartSearchTable {
  @ForeignKeyColumn(() => AssetTable, {
    onDelete: 'CASCADE',
    primary: true,
    constraintName: 'smart_search_assetId_fkey',
  })
  assetId!: string;

  @Column({ type: 'vector', length: 512, storage: 'external', synchronize: false })
  embedding!: string;
}
