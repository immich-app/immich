import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Int8,
  PrimaryColumn,
  Table,
  Timestamp,
} from '@immich/sql-tools';
import { AssetTable } from 'src/schema/tables/asset.table';

/**
 * A single sampled frame within a video's frame-extraction artifact (see `VideoFrameExtractionTable`).
 * Rows are kept intentionally minimal - the frame's timestamp is derivable from
 * `frameIndex / gridInterval` and is not stored, and no embedding data lives here; this table is a
 * generic, consumer-agnostic index of byte-range-addressable frames, shared by future trickplay
 * playback and video semantic search features alike.
 */
@Table('video_frame')
export class VideoFrameTable {
  @ForeignKeyColumn(() => AssetTable, {
    onDelete: 'CASCADE',
    primary: true,
    // [assetId, frameIndex] is the PK constraint
    index: false,
  })
  assetId!: string;

  @PrimaryColumn({ type: 'integer' })
  frameIndex!: number;

  @Column({ type: 'bigint' })
  byteOffset!: Int8;

  @Column({ type: 'integer' })
  byteSize!: number;

  /** Raw scdet mafd interval-change score for this frame, for future ML "cull" consumers. */
  @Column({ type: 'real' })
  intervalChange!: number;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;
}
