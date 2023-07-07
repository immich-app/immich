import { toBoolean, toSanitized, UploadFieldName } from '@app/domain';
import { AssetType } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAssetBase {
  @IsNotEmpty()
  deviceAssetId!: string;

  @IsNotEmpty()
  deviceId!: string;

  @IsNotEmpty()
  @IsEnum(AssetType)
  @ApiProperty({ enumName: 'AssetTypeEnum', enum: AssetType })
  assetType!: AssetType;

  @IsNotEmpty()
  fileCreatedAt!: Date;

  @IsNotEmpty()
  fileModifiedAt!: Date;

  @IsNotEmpty()
  isFavorite!: boolean;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  duration?: string;
}

export class CreateAssetDto extends CreateAssetBase {
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  isReadOnly?: boolean = false;

  @IsNotEmpty()
  fileExtension!: string;

  // The properties below are added to correctly generate the API docs
  // and client SDKs. Validation should be handled in the controller.
  @ApiProperty({ type: 'string', format: 'binary' })
  [UploadFieldName.ASSET_DATA]!: any;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  [UploadFieldName.LIVE_PHOTO_DATA]?: any;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  [UploadFieldName.SIDECAR_DATA]?: any;
}

export class ImportAssetDto extends CreateAssetBase {
  @IsOptional()
  @Transform(toBoolean)
  isReadOnly?: boolean = true;

  @IsString()
  @IsNotEmpty()
  @Transform(toSanitized)
  assetPath!: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Transform(toSanitized)
  sidecarPath?: string;
}
