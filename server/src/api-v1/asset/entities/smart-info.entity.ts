import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AssetEntity } from './asset.entity';

@Entity('smart_info')
export class SmartInfoEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  assetId: string;

  @Column({ type: 'text', array: true, nullable: true })
  tags: string[];

  @OneToOne(() => AssetEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'assetId', referencedColumnName: 'id' })
  asset: SmartInfoEntity;
}
