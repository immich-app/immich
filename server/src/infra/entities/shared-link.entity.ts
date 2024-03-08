import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { AlbumEntity } from './album.entity';
import { AssetEntity } from './asset.entity';
import { UserEntity } from './user.entity';

@Entity('shared_links')
@Unique('UQ_sharedlink_key', ['key'])
export class SharedLinkEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', nullable: true })
  password!: string | null;

  @Column()
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  user!: UserEntity;

  @Index('IDX_sharedlink_key')
  @Column({ type: 'bytea' })
  key!: Buffer; // use to access the inidividual asset

  @Column()
  type!: SharedLinkType;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @Column({ type: 'boolean', default: false })
  allowUpload!: boolean;

  @Column({ type: 'boolean', default: true })
  allowDownload!: boolean;

  @Column({ type: 'boolean', default: true })
  showExif!: boolean;

  @ManyToMany(() => AssetEntity, (asset) => asset.sharedLinks, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  assets!: AssetEntity[];

  @Index('IDX_sharedlink_albumId')
  @ManyToOne(() => AlbumEntity, (album) => album.sharedLinks, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  album?: AlbumEntity;

  @Column({ type: 'varchar', nullable: true })
  albumId!: string | null;
}

export enum SharedLinkType {
  ALBUM = 'ALBUM',

  /**
   * Individual asset
   * or group of assets that are not in an album
   */
  INDIVIDUAL = 'INDIVIDUAL',
}
