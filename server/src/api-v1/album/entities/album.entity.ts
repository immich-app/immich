import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AssetAlbumEntity } from './asset-album.entity';
import { UserAlbumEntity } from './user-album.entity';

@Entity('shared_albums')
export class AlbumEntity {
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

  @OneToMany(() => UserAlbumEntity, (userSharedAlbums) => userSharedAlbums.albumInfo)
  sharedUsers: UserAlbumEntity[];

  @OneToMany(() => AssetAlbumEntity, (assetSharedAlbumEntity) => assetSharedAlbumEntity.albumInfo)
  sharedAssets: AssetAlbumEntity[];
}
