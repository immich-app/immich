import { Optional, toBoolean, toSanitized, UploadFieldName } from '@app/domain';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateAssetBase {
  @IsNotEmpty()
  deviceAssetId!: string;

  @IsNotEmpty()
  deviceId!: string;

  @IsNotEmpty()
  fileCreatedAt!: Date;

  @IsNotEmpty()
  fileModifiedAt!: Date;

  @IsNotEmpty()
  isFavorite!: boolean;

  @Optional()
  @IsBoolean()
  isArchived?: boolean;

  @Optional()
  @IsBoolean()
  isVisible?: boolean;

  @Optional()
  duration?: string;
}

export class CreateAssetDto extends CreateAssetBase {
  @Optional()
  @IsBoolean()
  @Transform(toBoolean)
  isReadOnly?: boolean = false;

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
  @Optional()
  @Transform(toBoolean)
  isReadOnly?: boolean = true;

  @IsString()
  @IsNotEmpty()
  @Transform(toSanitized)
  assetPath!: string;

  @IsString()
  @Optional()
  @IsNotEmpty()
  @Transform(toSanitized)
  sidecarPath?: string;
}
