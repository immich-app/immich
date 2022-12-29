import { Column, Entity, ManyToMany, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { AlbumEntity } from './album.entity';
import { AssetEntity } from './asset.entity';

@Entity('shared_links')
export class SharedLinkEntity {
  @PrimaryColumn({ type: 'varchar' })
  id!: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  userId!: string;

  @Column()
  key!: string; // use to access the inidividual asset

  @Column()
  type!: SharedLinkType;

  @Column({ type: 'timestamptz' })
  createdAt!: string;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: string;

  @ManyToMany(() => AssetEntity, (asset) => asset.sharedLinks)
  assets!: AssetEntity[];

  @ManyToMany(() => AlbumEntity, (album) => album.sharedLinks)
  albums!: AlbumEntity[];
}

export enum SharedLinkType {
  ALBUM = 'ALBUM',

  /**
   * Individual asset
   * or group of assets that are not in an album
   */
  INDIVIDUAL = 'INDIVIDUAL',
}

// npm run typeorm -- migration:generate ./libs/database/src/AddSharedLinkTable -d libs/database/src/config/database.config.ts
