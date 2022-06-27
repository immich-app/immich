import { IsNotEmpty, IsOptional } from 'class-validator';
import { AssetType } from '@app/database/entities/asset.entity';

export class CreateAssetDto {
  @IsNotEmpty()
  deviceAssetId!: string;

  @IsNotEmpty()
  deviceId!: string;

  @IsNotEmpty()
  assetType!: AssetType;

  @IsNotEmpty()
  createdAt!: string;

  @IsNotEmpty()
  modifiedAt!: string;

  @IsNotEmpty()
  isFavorite!: boolean;

  @IsNotEmpty()
  fileExtension!: string;

  @IsOptional()
  duration?: string;
}
