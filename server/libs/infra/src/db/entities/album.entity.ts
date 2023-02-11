import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AssetAlbumEntity } from './asset-album.entity';
import { SharedLinkEntity } from './shared-link.entity';
import { UserAlbumEntity } from './user-album.entity';
import { UserEntity } from './user.entity';

@Entity('albums')
export class AlbumEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  ownerId!: string;

  @ManyToOne(() => UserEntity, { eager: true })
  owner!: UserEntity;

  @Column({ default: 'Untitled Album' })
  albumName!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: string;

  @Column({ comment: 'Asset ID to be used as thumbnail', type: 'varchar', nullable: true })
  albumThumbnailAssetId!: string | null;

  @OneToMany(() => UserAlbumEntity, (userAlbums) => userAlbums.albumInfo)
  sharedUsers?: UserAlbumEntity[];

  @OneToMany(() => AssetAlbumEntity, (assetAlbumEntity) => assetAlbumEntity.albumInfo)
  assets?: AssetAlbumEntity[];

  @OneToMany(() => SharedLinkEntity, (link) => link.album)
  sharedLinks!: SharedLinkEntity[];
}
