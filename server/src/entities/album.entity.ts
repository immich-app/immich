import { AlbumUserEntity } from 'src/entities/album-user.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { SharedLinkEntity } from 'src/entities/shared-link.entity';
import { UserEntity } from 'src/entities/user.entity';
import { AssetOrder } from 'src/enum';

export class AlbumEntity {
  id!: string;
  owner!: UserEntity;
  ownerId!: string;
  albumName!: string;
  description!: string;
  createdAt!: Date;
  updatedAt!: Date;
  updateId?: string;
  deletedAt!: Date | null;
  albumThumbnailAsset!: AssetEntity | null;
  albumThumbnailAssetId!: string | null;
  albumUsers!: AlbumUserEntity[];
  assets!: AssetEntity[];
  sharedLinks!: SharedLinkEntity[];
  isActivityEnabled!: boolean;
  order!: AssetOrder;
}
