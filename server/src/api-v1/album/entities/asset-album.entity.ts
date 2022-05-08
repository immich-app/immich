import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { AssetEntity } from '../../asset/entities/asset.entity';
import { AlbumEntity } from './album.entity';

@Entity('asset_shared_album')
@Unique('PK_unique_asset_in_album', ['albumId', 'assetId'])
export class AssetAlbumEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  albumId: string;

  @Column()
  assetId: string;

  @ManyToOne(() => AlbumEntity, (album) => album.sharedAssets, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'albumId' })
  albumInfo: AlbumEntity;

  @ManyToOne(() => AssetEntity, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'assetId' })
  assetInfo: AssetEntity;
}
