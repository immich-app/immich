import { Column, ForeignKeyColumn, Generated, PrimaryGeneratedColumn, Table } from '@immich/sql-tools';
import { AssetTable } from 'src/schema/tables/asset.table';

@Table('transcript_segment')
export class TranscriptSegmentTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  assetId!: string;

  @Column({ type: 'real' })
  startTime!: number;

  @Column({ type: 'real' })
  endTime!: number;

  @Column({ type: 'text' })
  text!: string;

  /**
   * Resolved language of this segment, as an ISO 639-1 code. Nullable only because segments
   * written before language detection existed have none. Storing it per segment rather than per
   * asset is what a per-language caption track would need, so that becomes a rendering change
   * rather than a schema change.
   */
  @Column({ type: 'text', nullable: true })
  language!: string | null;

  /**
   * The model's own signals about how much it believes this segment, stored rather than acted on.
   * Recognition run on music, breathing or distant noise produces confident, plausibly-timed
   * captions from its training data rather than nothing at all, and these are what identify them.
   *
   * Every segment is written whatever they say. Filtering at ingest would be a one-way door: the
   * caption track and the search text are derived artifacts and can be re-derived, but inference
   * discarded is inference that has to be re-run across the whole library to get back. Nullable
   * only because segments written before this change carry no signals.
   */
  @Column({ type: 'real', nullable: true })
  noSpeechProbability!: number | null;

  @Column({ type: 'real', nullable: true })
  avgLogProbability!: number | null;

  /** Ratio of decoded text to its gzip size; a repetition loop compresses far better than speech. */
  @Column({ type: 'real', nullable: true })
  compressionRatio!: number | null;

  /**
   * A human correction of `text`, preferred over it wherever a segment's text is read. Nullable
   * because most segments are never corrected. The write path belongs to transcript correction;
   * this column exists ahead of it so the search index can already prefer a correction the moment
   * one is written, rather than that becoming a second change to the index later.
   */
  @Column({ type: 'text', nullable: true })
  correctedText!: string | null;
}
