import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Optional, ValidateDate } from 'src/validation';

export enum UploadFieldName {
  ASSET_DATA = 'assetData',
  LIVE_PHOTO_DATA = 'livePhotoData',
  SIDECAR_DATA = 'sidecarData',
  PROFILE_DATA = 'file',
}
export class UpdateAssetMediaDto {
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

  // The properties below are added to correctly generate the API docs
  // and client SDKs. Validation should be handled in the controller.
  @ApiProperty({ type: 'string', format: 'binary' })
  [UploadFieldName.ASSET_DATA]!: any;
}
