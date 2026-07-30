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
}
