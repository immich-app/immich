import { AssetEntity } from 'src/entities/asset.entity';
import { UserEntity } from 'src/entities/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity('asset_user')
export class AssetUserEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user?: UserEntity;

  @PrimaryColumn()
  userId!: string;

  @ManyToOne(() => AssetEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assetId', referencedColumnName: 'id' })
  @Index()
  asset?: AssetEntity;

  @PrimaryColumn()
  assetId!: string;

  @Column({ type: 'boolean', default: false })
  isFavorite!: boolean;
}
