import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AssetEntity } from './asset.entity';

@Entity('live_photos')
export class LivePhotoEntity {
  @PrimaryGeneratedColumn()
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  assetId!: string;

  @Column()
  originalPath!: string;

  @OneToOne(() => AssetEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'assetId', referencedColumnName: 'id' })
  asset?: AssetEntity;
}
