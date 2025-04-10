import { AlbumUser, User } from 'src/database';
import { AssetEntity } from 'src/entities/asset.entity';
import { SharedLinkEntity } from 'src/entities/shared-link.entity';
import { AssetOrder } from 'src/enum';

export class AlbumEntity {
  id!: string;
  owner!: User;
  ownerId!: string;
  albumName!: string;
  description!: string;
  createdAt!: Date;
  updatedAt!: Date;
  updateId?: string;
  deletedAt!: Date | null;
  albumThumbnailAsset!: AssetEntity | null;
  albumThumbnailAssetId!: string | null;
  albumUsers!: AlbumUser[];
  assets!: AssetEntity[];
  sharedLinks!: SharedLinkEntity[];
  isActivityEnabled!: boolean;
  order!: AssetOrder;
}
