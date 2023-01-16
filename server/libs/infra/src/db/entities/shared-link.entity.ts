import { Column, Entity, Index, ManyToMany, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { AlbumEntity } from './album.entity';
import { AssetEntity } from './asset.entity';

@Entity('shared_links')
@Unique('UQ_sharedlink_key', ['key'])
export class SharedLinkEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  userId!: string;

  @Index('IDX_sharedlink_key')
  @Column({ type: 'bytea' })
  key!: Buffer; // use to access the inidividual asset

  @Column()
  type!: SharedLinkType;

  @Column({ type: 'timestamptz' })
  createdAt!: string;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt!: string | null;

  @Column({ type: 'boolean', default: false })
  allowUpload!: boolean;

  @Column({ type: 'boolean', default: true })
  allowDownload!: boolean;

  @Column({ type: 'boolean', default: true })
  showExif!: boolean;

  @ManyToMany(() => AssetEntity, (asset) => asset.sharedLinks)
  assets!: AssetEntity[];

  @ManyToOne(() => AlbumEntity, (album) => album.sharedLinks)
  album?: AlbumEntity;
}

export enum SharedLinkType {
  ALBUM = 'ALBUM',

  /**
   * Individual asset
   * or group of assets that are not in an album
   */
  INDIVIDUAL = 'INDIVIDUAL',
}

// npm run typeorm -- migration:generate ./libs/infra/src/db/AddMorePermissionToSharedLink -d ./libs/infra/src/db/config/database.config.ts
