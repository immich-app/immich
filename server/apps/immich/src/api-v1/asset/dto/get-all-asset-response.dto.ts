import { AssetEntity } from '@app/database/entities/asset.entity';

// TODO: this doesn't seem to be used
export class GetAllAssetReponseDto {
  data!: Array<{ date: string; assets: Array<AssetEntity> }>;
  count!: number;
  nextPageKey!: string;
}
