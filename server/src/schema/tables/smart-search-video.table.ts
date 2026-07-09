import { Column, ForeignKeyColumn, Index, Table } from '@immich/sql-tools';
import { AssetTable } from 'src/schema/tables/asset.table';

@Table({ name: 'smart_search_video' })
@Index({
  name: 'clip_video_index',
  using: 'hnsw',
  expression: `embedding vector_cosine_ops`,
  with: `ef_construction = 300, m = 16`,
  synchronize: false,
})
export class SmartSearchVideoTable {
  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE' })
  assetId!: string;

  @Column({ type: 'integer' })
  frameIndex!: number;

  @Column({ type: 'integer' })
  timestamp!: number;

  @Column({ type: 'vector', length: 512, storage: 'external', synchronize: false })
  embedding!: string;
}
