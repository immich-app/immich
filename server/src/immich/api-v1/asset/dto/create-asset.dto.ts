import { Optional, UploadFieldName, ValidateBoolean, ValidateDate, ValidateUUID } from '@app/domain';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAssetDto {
  @ValidateUUID({ optional: true })
  libraryId?: string;

  @IsNotEmpty()
  @IsString()
  deviceAssetId!: string;

  @IsNotEmpty()
  @IsString()
  deviceId!: string;

  @ValidateDate()
  fileCreatedAt!: Date;

  @ValidateDate()
  fileModifiedAt!: Date;

  @Optional()
  @IsString()
  duration?: string;

  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @ValidateBoolean({ optional: true })
  isArchived?: boolean;

  @ValidateBoolean({ optional: true })
  isVisible?: boolean;

  @ValidateBoolean({ optional: true })
  isOffline?: boolean;

  @ValidateBoolean({ optional: true })
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
