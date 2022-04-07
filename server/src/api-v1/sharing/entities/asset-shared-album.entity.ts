import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { AssetEntity } from '../../asset/entities/asset.entity';
import { SharedAlbumEntity } from './shared-album.entity';

@Entity('asset_shared_album')
@Unique(['albumId', 'assetId'])
export class AssetSharedAlbumEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  albumId: string;

  @Column()
  assetId: string;

  @ManyToOne(() => SharedAlbumEntity, (sharedAlbum) => sharedAlbum.sharedAssets, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'albumId' })
  albumInfo: SharedAlbumEntity;

  @OneToOne(() => AssetEntity)
  @JoinColumn({ name: 'assetId' })
  assetInfo: AssetEntity;
}
