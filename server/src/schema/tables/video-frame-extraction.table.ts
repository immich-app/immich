import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { VideoFrameExtractionStatus } from 'src/enum';
import { video_frame_extraction_status_enum } from 'src/schema/enums';
import { AssetTable } from 'src/schema/tables/asset.table';

@Table('video_frame_extraction')
@UpdatedAtTrigger('video_frame_extraction_updatedAt')
export class VideoFrameExtractionTable {
  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', primary: true })
  assetId!: string;

  @Column({ enum: video_frame_extraction_status_enum })
  status!: VideoFrameExtractionStatus;

  @Column({ type: 'integer' })
  version!: number;

  @Column({ type: 'jsonb' })
  parameters!: Record<string, unknown>;

  @Column({ type: 'character varying', index: true })
  parametersHash!: string;

  @Column({ type: 'text', nullable: true })
  path!: string | null;

  @Column({ type: 'integer', nullable: true })
  initSegmentSize!: number | null;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
