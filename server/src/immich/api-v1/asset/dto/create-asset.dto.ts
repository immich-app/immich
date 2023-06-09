import { AssetType } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ImmichFile } from '../../../config/asset-upload.config';

export class CreateAssetDto {
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

  @IsNotEmpty()
  fileExtension!: string;

  @IsOptional()
  duration?: string;

  // The properties below are added to correctly generate the API docs
  // and client SDKs. Validation should be handled in the controller.
  @ApiProperty({ type: 'string', format: 'binary' })
  assetData!: any;

  @ApiProperty({ type: 'string', format: 'binary' })
  livePhotoData?: any;

  @ApiProperty({ type: 'string', format: 'binary' })
  sidecarData?: any;
}

export interface UploadFile {
  mimeType: string;
  checksum: Buffer;
  originalPath: string;
  originalName: string;
}

export function mapToUploadFile(file: ImmichFile): UploadFile {
  return {
    checksum: file.checksum,
    mimeType: file.mimetype,
    originalPath: file.path,
    originalName: file.originalname,
  };
}
