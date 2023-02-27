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
import { SharedLinkEntity } from './shared-link.entity';
import { AssetEntity } from './asset.entity';
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
  createdAt!: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: string;

  @Column({ comment: 'Asset ID to be used as thumbnail', type: 'varchar', nullable: true })
  albumThumbnailAssetId!: string | null;

  @ManyToMany(() => UserEntity)
  @JoinTable()
  sharedUsers!: UserEntity[];

  @ManyToMany(() => AssetEntity)
  @JoinTable()
  assets!: AssetEntity[];

  @OneToMany(() => SharedLinkEntity, (link) => link.album)
  sharedLinks!: SharedLinkEntity[];
}
