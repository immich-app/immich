import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
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

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

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
}
