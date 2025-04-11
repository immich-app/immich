import { AlbumEntity } from 'src/entities/album.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { SharedLinkType } from 'src/enum';

export class SharedLinkEntity {
  id!: string;
  description!: string | null;
  password!: string | null;
  userId!: string;
  key!: Buffer; // use to access the inidividual asset
  type!: SharedLinkType;
  createdAt!: Date;
  expiresAt!: Date | null;
  allowUpload!: boolean;
  allowDownload!: boolean;
  showExif!: boolean;
  assets!: AssetEntity[];
  album?: AlbumEntity;
  albumId!: string | null;
}
