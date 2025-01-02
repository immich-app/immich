import type { NonAttribute } from 'kysely-typeorm';
import { AlbumEntity } from 'src/entities/album.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity('albums_assets_assets')
export class AlbumAssetEntity {
  @PrimaryColumn('uuid')
  @Index('IDX_e590fa396c6898fcd4a50e4092')
  albumsId!: string;

  @ManyToOne(() => AlbumEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'albumsId' })
  album!: NonAttribute<AlbumEntity>;

  @PrimaryColumn('uuid')
  @Index('IDX_4bd1303d199f4e72ccdf998c62')
  assetsId!: string;

  @ManyToOne(() => AssetEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'assetsId' })
  asset!: NonAttribute<AssetEntity>;
}
