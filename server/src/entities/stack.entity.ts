import { AssetEntity } from 'src/entities/asset.entity';
import { UserEntity } from 'src/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('asset_stack')
export class StackEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  owner!: UserEntity;

  @Column()
  ownerId!: string;

  @OneToMany(() => AssetEntity, (asset) => asset.stack)
  assets!: AssetEntity[];

  @OneToOne(() => AssetEntity)
  @JoinColumn()
  //TODO: Add constraint to ensure primary asset exists in the assets array
  primaryAsset!: AssetEntity;

  @Column({ nullable: false })
  primaryAssetId!: string;

  assetCount?: number;
}
