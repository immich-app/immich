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
}
