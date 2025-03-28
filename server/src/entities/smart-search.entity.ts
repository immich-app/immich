import { AssetEntity } from 'src/entities/asset.entity';

export class SmartSearchEntity {
  asset?: AssetEntity;
  assetId!: string;
  embedding!: string;
}
