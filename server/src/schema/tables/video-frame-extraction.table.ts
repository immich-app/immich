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

/**
 * Tracks the generation of the shared, per-video frame-extraction artifact (an all-intra fMP4 of
 * downsampled, byte-range-addressable frames sampled at a fixed interval). This artifact is the
 * shared foundation for multiple future consumers (trickplay/seek-bar previews, video semantic
 * search embeddings, and other frame-based video features) - see `VideoFrameTable` for the
 * per-frame index of this artifact.
 */
@Table('video_frame_extraction')
@UpdatedAtTrigger('video_frame_extraction_updatedAt')
export class VideoFrameExtractionTable {
  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', primary: true })
  assetId!: string;

  @Column({ enum: video_frame_extraction_status_enum })
  status!: VideoFrameExtractionStatus;

  /** Bumped when the generation command/output format changes in a way that requires regeneration. */
  @Column({ type: 'integer' })
  version!: number;

  /** The exact generation parameters used (resolution, qp, gridInterval, codec, hwaccel, etc.), for introspection. */
  @Column({ type: 'jsonb' })
  parameters!: Record<string, unknown>;

  /**
   * A cheap fingerprint of `{ version, parameters }`, used to detect staleness in bulk without a
   * deep JSON comparison (e.g. when a system-config value changes and existing rows need to be
   * flagged for regeneration).
   */
  @Column({ type: 'character varying', index: true })
  parametersHash!: string;

  /** Path to the generated artifact on disk. Null until generation completes at least once. */
  @Column({ type: 'text', nullable: true })
  path!: string | null;

  /** Byte size of the fMP4 init segment (always located at byte offset 0 of the artifact). */
  @Column({ type: 'integer', nullable: true })
  initSegmentSize!: number | null;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
