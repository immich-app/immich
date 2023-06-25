import { AssetType } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ImmichFile } from '../../../config/asset-upload.config';
import { toBoolean, toSanitized } from '../../../utils/transform.util';

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
  assetData!: any;

  @ApiProperty({ type: 'string', format: 'binary' })
  livePhotoData?: any;

  @ApiProperty({ type: 'string', format: 'binary' })
  sidecarData?: any;
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
