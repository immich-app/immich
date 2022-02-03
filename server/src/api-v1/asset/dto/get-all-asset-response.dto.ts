import { AssetEntity } from '../entities/asset.entity';

export class GetAllAssetReponseDto {
  data: Array<{ date: string; assets: Array<AssetEntity> }>;
  count: number;
  nextPageKey: string;
}
