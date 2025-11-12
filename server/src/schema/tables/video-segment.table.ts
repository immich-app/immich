import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { AssetTable } from 'src/schema/tables/asset.table';
import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Index,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table({ name: 'video_segment' })
@UpdatedAtTrigger('video_segment_updatedAt')
@Index({ name: 'video_segment_asset_idx', columns: ['assetId'] })
@Index({
  name: 'video_segment_clip_index',
  using: 'hnsw',
  expression: `embedding vector_cosine_ops`,
  with: `ef_construction = 300, m = 16`,
  synchronize: false,
})
export class VideoSegmentTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', index: false })
  assetId!: string;

  @Column({ type: 'integer' })
  segmentIndex!: number;

  @Column({ type: 'double precision' })
  startTime!: number;

  @Column({ type: 'double precision' })
  endTime!: number;

  @Column({ type: 'vector', length: 512, storage: 'external', synchronize: false })
  embedding!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn()
  updateId!: Generated<string>;
}
