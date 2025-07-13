import { AssetTable } from 'src/schema/tables/asset.table';
import { Column, ForeignKeyColumn, Table, Timestamp } from 'src/sql-tools';

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
  previewAt!: Timestamp | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  thumbnailAt!: Timestamp | null;
}
