import { AssetType } from '@app/infra/db/entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';

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

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsNotEmpty()
  fileExtension!: string;

  @IsOptional()
  duration?: string;
}

export interface UploadFile {
  mimeType: string;
  checksum: Buffer;
  originalPath: string;
  originalName: string;
}
