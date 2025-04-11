import { AssetEntity } from 'src/entities/asset.entity';

export class StackEntity {
  id!: string;
  ownerId!: string;
  assets!: AssetEntity[];
  primaryAsset!: AssetEntity;
  primaryAssetId!: string;
  assetCount?: number;
}
