import { Optional, toBoolean, UploadFieldName, ValidateUUID } from '@app/domain';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNotEmpty, IsString } from 'class-validator';

export class CreateAssetDto {
  @ValidateUUID({ optional: true })
  libraryId?: string;

  @IsNotEmpty()
  @IsString()
  deviceAssetId!: string;

  @IsNotEmpty()
  @IsString()
  deviceId!: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  fileCreatedAt!: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  fileModifiedAt!: Date;

  @Optional()
  @IsString()
  duration?: string;

  @Optional()
  @IsBoolean()
  @Transform(toBoolean)
  isFavorite?: boolean;

  @Optional()
  @IsBoolean()
  @Transform(toBoolean)
  isArchived?: boolean;

  @Optional()
  @IsBoolean()
  @Transform(toBoolean)
  isVisible?: boolean;

  @Optional()
  @IsBoolean()
  @Transform(toBoolean)
  isOffline?: boolean;

  @Optional()
  @IsBoolean()
  @Transform(toBoolean)
  isReadOnly?: boolean;

  // The properties below are added to correctly generate the API docs
  // and client SDKs. Validation should be handled in the controller.
  @ApiProperty({ type: 'string', format: 'binary' })
  [UploadFieldName.ASSET_DATA]!: any;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  [UploadFieldName.LIVE_PHOTO_DATA]?: any;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  [UploadFieldName.SIDECAR_DATA]?: any;
}
