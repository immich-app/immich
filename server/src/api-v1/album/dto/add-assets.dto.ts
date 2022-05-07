import { IsNotEmpty } from 'class-validator';
import { AssetEntity } from '../../asset/entities/asset.entity';

export class AddAssetsDto {
  @IsNotEmpty()
  assetIds: string[];
}
