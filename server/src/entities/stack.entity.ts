import { Generated, NonAttribute } from 'kysely-typeorm';
import { AssetEntity } from 'src/entities/asset.entity';
import { UserEntity } from 'src/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('asset_stack')
export class StackEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  owner!: NonAttribute<UserEntity>;

  @Column()
  ownerId!: string;

  @OneToMany(() => AssetEntity, (asset) => asset.stack)
  assets!: NonAttribute<AssetEntity[]>;

  @OneToOne(() => AssetEntity)
  @JoinColumn()
  //TODO: Add constraint to ensure primary asset exists in the assets array
  primaryAsset!: NonAttribute<AssetEntity>;

  @Column({ nullable: false })
  primaryAssetId!: string;

  assetCount?: number;
}
