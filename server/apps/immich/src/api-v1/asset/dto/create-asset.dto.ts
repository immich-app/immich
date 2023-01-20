import { IsNotEmpty, IsOptional } from 'class-validator';
import { AssetType } from '@app/infra';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssetDto {
  @IsNotEmpty()
  deviceAssetId!: string;

  @IsNotEmpty()
  deviceId!: string;

  @IsNotEmpty()
  @ApiProperty({ enumName: 'AssetTypeEnum', enum: AssetType })
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
