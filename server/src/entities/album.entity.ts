import type { Generated, NonAttribute } from 'kysely-typeorm';
import { AlbumUserEntity } from 'src/entities/album-user.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { SharedLinkEntity } from 'src/entities/shared-link.entity';
import { UserEntity } from 'src/entities/user.entity';
import { AssetOrder } from 'src/enum';
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
} from 'typeorm';

@Entity('albums')
export class AlbumEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  owner!: NonAttribute<UserEntity>;

  @Column()
  ownerId!: string;

  @Column({ default: 'Untitled Album' })
  albumName!: Generated<string>;

  @Column({ type: 'text', default: '' })
  description!: Generated<string>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Generated<Date>;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Generated<Date>;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt!: Date | null;

  @ManyToOne(() => AssetEntity, { nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  albumThumbnailAsset!: NonAttribute<AssetEntity | null>;

  @Column({ comment: 'Asset ID to be used as thumbnail', nullable: true })
  albumThumbnailAssetId!: string | null;

  @OneToMany(() => AlbumUserEntity, ({ album }) => album, { cascade: true, onDelete: 'CASCADE' })
  albumUsers!: NonAttribute<AlbumUserEntity[]>;

  @ManyToMany(() => AssetEntity, (asset) => asset.albums)
  @JoinTable({ synchronize: false })
  assets!: NonAttribute<AssetEntity[]>;

  @OneToMany(() => SharedLinkEntity, (link) => link.album)
  sharedLinks!: NonAttribute<SharedLinkEntity[]>;

  @Column({ default: true })
  isActivityEnabled!: Generated<boolean>;

  @Column({ type: 'varchar', default: AssetOrder.DESC })
  order!: Generated<AssetOrder>;
}
