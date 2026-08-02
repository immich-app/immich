import { Column, ForeignKeyColumn, Table, Timestamp } from '@immich/sql-tools';
import { AssetTable } from 'src/schema/tables/asset.table';

@Table('asset_job_status')
export class AssetJobStatusTable {
  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', primary: true })
  assetId!: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  facesRecognizedAt!: Timestamp | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  metadataExtractedAt!: Timestamp | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  duplicatesDetectedAt!: Timestamp | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  ocrAt!: Timestamp | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  transcribedAt!: Timestamp | null;

  /**
   * How far into the audio transcription has committed, in milliseconds. A time offset rather than
   * a chunk index because indices are not stable across runs: change the target chunk size or the
   * silence thresholds between a failure and its retry and a given index denotes a different
   * region, while an offset stays meaningful under any re-planning.
   *
   * Null means transcription has never started, which the maximum segment end time cannot express:
   * with voice activity detection a chunk can legitimately produce no segments, leaving the absence
   * of rows ambiguous between "processed, found no speech" and "never processed".
   */
  @Column({ type: 'integer', nullable: true })
  transcriptionProgressMs!: number | null;

  /**
   * Set alongside `transcribedAt` when the asset was never transcribed because its duration exceeds
   * the configured maximum, so that "done, and why" survives the read that only `transcribedAt`
   * alone cannot answer — it looks identical to a normal completion otherwise.
   */
  @Column({ type: 'boolean', nullable: true })
  transcriptionMaxDurationExceeded!: boolean | null;
}
