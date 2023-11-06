import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { AssetEntity } from './asset.entity';

@Entity('asset_job_status')
export class AssetJobStatus {
  @OneToOne(() => AssetEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn()
  asset?: AssetEntity;

  @PrimaryColumn()
  assetId!: string;

  @Column({ type: 'timestamptz', nullable: true })
  facesRecognizedAt!: Date | null;
}
