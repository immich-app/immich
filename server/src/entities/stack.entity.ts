import { AssetEntity } from 'src/entities/asset.entity';
import { UserEntity } from 'src/entities/user.entity';

export class StackEntity {
  id!: string;
  owner!: UserEntity;
  ownerId!: string;
  assets!: AssetEntity[];
  primaryAsset!: AssetEntity;
  primaryAssetId!: string;
  assetCount?: number;
}
