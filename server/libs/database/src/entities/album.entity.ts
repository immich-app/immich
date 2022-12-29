import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AssetAlbumEntity } from './asset-album.entity';
import { SharedLinkEntity } from './shared-link.entity';
import { UserAlbumEntity } from './user-album.entity';

@Entity('albums')
export class AlbumEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  ownerId!: string;

  @Column({ default: 'Untitled Album' })
  albumName!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: string;

  @Column({ comment: 'Asset ID to be used as thumbnail', type: 'varchar', nullable: true })
  albumThumbnailAssetId!: string | null;

  @OneToMany(() => UserAlbumEntity, (userAlbums) => userAlbums.albumInfo)
  sharedUsers?: UserAlbumEntity[];

  @OneToMany(() => AssetAlbumEntity, (assetAlbumEntity) => assetAlbumEntity.albumInfo)
  assets?: AssetAlbumEntity[];

  @ManyToMany(() => SharedLinkEntity, (link) => link.albums, { cascade: true })
  @JoinTable({ name: 'sharedlink_album' })
  sharedLinks!: SharedLinkEntity[];
}
