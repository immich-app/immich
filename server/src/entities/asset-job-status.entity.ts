import { AssetEntity } from 'src/entities/asset.entity';
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

@Entity('asset_job_status')
export class AssetJobStatusEntity {
  @OneToOne(() => AssetEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn()
  asset!: AssetEntity;

  @PrimaryColumn()
  assetId!: string;

  @Column({ type: 'timestamptz', nullable: true })
  facesRecognizedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  metadataExtractedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  duplicatesDetectedAt!: Date | null;
}
