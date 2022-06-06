import { IsNotEmpty } from 'class-validator';
import { AssetEntity } from '@app/database/entities/asset.entity';

export class AddAssetsDto {
  @IsNotEmpty()
  albumId: string;

  @IsNotEmpty()
  assetIds: string[];
}
