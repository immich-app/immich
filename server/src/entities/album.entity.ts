import { AssetEntity } from 'src/entities/asset.entity';
import { SharedLinkEntity } from 'src/entities/shared-link.entity';
import { UserEntity } from 'src/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// ran into issues when importing the enum from `asset.dto.ts`
export enum AssetOrder {
  ASC = 'asc',
  DESC = 'desc',
}

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

  @Column({ type: 'varchar', default: AssetOrder.DESC })
  order!: AssetOrder;

  @ManyToMany(() => AlbumEntity, (album) => album.parentAlbums)
  @JoinTable({
    name: 'sub_albums',
    joinColumn: { name: 'childId' },
    inverseJoinColumn: { name: 'parentId' },
    synchronize: false,
  })
  parentAlbums!: AlbumEntity[];

  @ManyToMany(() => AlbumEntity, (album) => album.childAlbums)
  @JoinTable({
    name: 'sub_albums',
    joinColumn: { name: 'parentId' },
    inverseJoinColumn: { name: 'childId' },
    synchronize: false,
  })
  childAlbums!: AlbumEntity[];
}

@Entity('sub_albums', { synchronize: false })
export class SubAlbumEntity {
  @PrimaryColumn()
  parentId!: string;

  @PrimaryColumn()
  childId!: string;

  @ManyToOne(() => AlbumEntity, (album) => album.childAlbums, { onDelete: 'CASCADE' })
  parent!: AlbumEntity;

  @ManyToOne(() => AlbumEntity, (album) => album.parentAlbums, { onDelete: 'CASCADE' })
  child!: AlbumEntity;
}
