import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AssetSharedAlbumEntity } from './asset-shared-album.entity';
import { UserSharedAlbumEntity } from './user-shared-album.entity';

@Entity('shared_albums')
export class SharedAlbumEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ownerId: string;

  @Column({ default: 'Untitled Album' })
  albumName: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: string;

  @Column({ comment: 'Asset ID to be used as thumbnail', nullable: true })
  albumThumbnailAssetId: string;

  @OneToMany(() => UserSharedAlbumEntity, (userSharedAlbums) => userSharedAlbums.albumInfo)
  sharedUsers: UserSharedAlbumEntity[];

  @OneToMany(() => AssetSharedAlbumEntity, (assetSharedAlbumEntity) => assetSharedAlbumEntity.albumInfo)
  sharedAssets: AssetSharedAlbumEntity[];
}
