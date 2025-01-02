import { Generated, NonAttribute } from 'kysely-typeorm';
import { AlbumEntity } from 'src/entities/album.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { UserEntity } from 'src/entities/user.entity';
import { SharedLinkType } from 'src/enum';
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

@Entity('shared_links')
@Unique('UQ_sharedlink_key', ['key'])
export class SharedLinkEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @Column({ type: 'varchar', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', nullable: true })
  password!: string | null;

  @Column()
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  user!: NonAttribute<UserEntity>;

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
  allowUpload!: Generated<boolean>;

  @Column({ type: 'boolean', default: true })
  allowDownload!: Generated<boolean>;

  @Column({ type: 'boolean', default: true })
  showExif!: Generated<boolean>;

  @ManyToMany(() => AssetEntity, (asset) => asset.sharedLinks, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  assets!: NonAttribute<AssetEntity[]>;

  @Index('IDX_sharedlink_albumId')
  @ManyToOne(() => AlbumEntity, (album) => album.sharedLinks, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  album!: NonAttribute<AlbumEntity>;

  @Column({ type: 'varchar', nullable: true })
  albumId!: string | null;
}
