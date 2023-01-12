import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { AlbumEntity } from './album.entity';
import { AssetEntity } from './asset.entity';

@Entity('asset_album')
@Unique('UQ_unique_asset_in_album', ['albumId', 'assetId'])
export class AssetAlbumEntity {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column()
  albumId!: string;

  @Column()
  @OneToOne(() => AssetEntity, (entity) => entity.id)
  assetId!: string;

  @ManyToOne(() => AlbumEntity, (album) => album.assets, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'albumId' })
  albumInfo!: AlbumEntity;

  @ManyToOne(() => AssetEntity, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'assetId' })
  assetInfo!: AssetEntity;
}
