import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VirtualColumn,
} from 'typeorm';
import { AssetEntity } from './asset.entity';
import { SharedLinkEntity } from './shared-link.entity';
import { UserEntity } from './user.entity';

@Entity('albums')
export class AlbumEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  owner!: UserEntity;

  @Column()
  ownerId!: string;

  @Column({ default: 'Untitled Album' })
  albumName!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt!: Date | null;

  @ManyToOne(() => AssetEntity, { nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  albumThumbnailAsset!: AssetEntity | null;

  @Column({ comment: 'Asset ID to be used as thumbnail', nullable: true })
  albumThumbnailAssetId!: string | null;

  @ManyToMany(() => UserEntity)
  @JoinTable()
  sharedUsers!: UserEntity[];

  @ManyToMany(() => AssetEntity, (asset) => asset.albums)
  @JoinTable()
  assets!: AssetEntity[];

  @OneToMany(() => SharedLinkEntity, (link) => link.album)
  sharedLinks!: SharedLinkEntity[];

  @Column({ default: true })
  isActivityEnabled!: boolean;

  @VirtualColumn({
    query: (alias) => `
    SELECT MIN(assets."fileCreatedAt") 
    FROM "assets" assets
    JOIN "albums_assets_assets" aa ON aa."assetsId" = assets.id
    WHERE aa."albumsId" = ${alias}.id
    `,
  })
  startDate!: Date | null;

  @VirtualColumn({
    query: (alias) => `
    SELECT MAX(assets."fileCreatedAt") 
    FROM "assets" assets
    JOIN "albums_assets_assets" aa ON aa."assetsId" = assets.id
    WHERE aa."albumsId" = ${alias}.id
    `,
  })
  endDate!: Date | null;

  @VirtualColumn({
    query: (alias) => `
    SELECT COUNT(assets."id") 
    FROM "assets" assets
    JOIN "albums_assets_assets" aa ON aa."assetsId" = assets.id
    WHERE aa."albumsId" = ${alias}.id
    `,
  })
  assetCount!: number;
}
