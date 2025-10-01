import { BadRequestException } from '@nestjs/common';
import { Expose, plainToInstance, Transform, Type } from 'class-transformer';
import { Equals, IsArray, IsEnum, IsInt, IsNotEmpty, IsString, Min, ValidateIf, ValidateNested } from 'class-validator';
import { AssetMetadataUpsertItemDto } from 'src/dtos/asset.dto';
import { AssetVisibility, ImmichHeader } from 'src/enum';
import { Optional, ValidateBoolean, ValidateDate, ValidateEnum, ValidateUUID } from 'src/validation';
import { parseDictionary } from 'structured-headers';

export class UploadAssetDataDto {
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

  @IsString()
  @IsNotEmpty()
  filename!: string;

  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @ValidateEnum({ enum: AssetVisibility, name: 'AssetVisibility', optional: true })
  visibility?: AssetVisibility;

  @ValidateUUID({ optional: true })
  livePhotoVideoId?: string;

  @Transform(({ value }) => {
    try {
      const json = JSON.parse(value);
      const items = Array.isArray(json) ? json : [json];
      return items.map((item) => plainToInstance(AssetMetadataUpsertItemDto, item));
    } catch {
      throw new BadRequestException(['metadata must be valid JSON']);
    }
  })
  @Optional()
  @ValidateNested({ each: true })
  @IsArray()
  metadata!: AssetMetadataUpsertItemDto[];
}

export enum StructuredBoolean {
  False = '?0',
  True = '?1',
}

export enum UploadHeader {
  UploadOffset = 'upload-offset',
  ContentLength = 'content-length',
  UploadLength = 'upload-length',
  UploadComplete = 'upload-complete',
  UploadIncomplete = 'upload-incomplete',
  InteropVersion = 'upload-draft-interop-version',
  ReprDigest = 'repr-digest',
}

class BaseRufhHeadersDto {
  @Expose({ name: UploadHeader.InteropVersion })
  @Min(3)
  @IsInt()
  @Type(() => Number)
  version!: number;
}

export class BaseUploadHeadersDto extends BaseRufhHeadersDto {
  @Expose({ name: UploadHeader.ContentLength })
  @Min(0)
  @IsInt()
  @Type(() => Number)
  contentLength!: number;

  @Expose({ name: UploadHeader.UploadComplete })
  @ValidateIf((o) => o.requestInterop !== null && o.requestInterop! <= 3)
  @IsEnum(StructuredBoolean)
  uploadComplete!: StructuredBoolean;

  @Expose({ name: UploadHeader.UploadIncomplete })
  @ValidateIf((o) => o.requestInterop === null || o.requestInterop! > 3)
  @IsEnum(StructuredBoolean)
  uploadIncomplete!: StructuredBoolean;

  @Expose({ name: UploadHeader.UploadLength })
  @Min(0)
  @IsInt()
  @Type(() => Number)
  @Optional()
  uploadLength?: number;

  get isComplete(): boolean {
    if (this.version <= 3) {
      return this.uploadIncomplete === StructuredBoolean.False;
    }
    return this.uploadComplete === StructuredBoolean.True;
  }
}

export class StartUploadDto extends BaseUploadHeadersDto {
  @Expose({ name: ImmichHeader.AssetData })
  // @ValidateNested()
  // @IsObject()
  @Type(() => UploadAssetDataDto)
  @Transform(({ value }) => {
    if (!value) {
      return null;
    }

    const json = Buffer.from(value, 'base64').toString('utf-8');
    try {
      return JSON.parse(json);
    } catch {
      throw new BadRequestException(`${ImmichHeader.AssetData} must be valid base64-encoded JSON`);
    }
  })
  assetData!: UploadAssetDataDto;

  @Expose({ name: UploadHeader.ReprDigest })
  @Transform(({ value }) => {
    if (!value) {
      return null;
    }

    const checksum = parseDictionary(value).get('sha')?.[0];
    if (checksum instanceof ArrayBuffer) {
      return Buffer.from(checksum);
    }
    throw new BadRequestException(`Invalid ${UploadHeader.ReprDigest} header`);
  })
  checksum!: Buffer;

  @Expose({ name: UploadHeader.UploadLength })
  @Min(0)
  @IsInt()
  @Type(() => Number)
  declare uploadLength: number;
}

export class ResumeUploadDto extends BaseUploadHeadersDto {
  @Expose({ name: 'content-type' })
  @ValidateIf((o) => o.requestInterop !== null && o.requestInterop >= 6)
  @Equals('application/partial-upload')
  contentType!: number | null;

  @Expose({ name: UploadHeader.UploadOffset })
  @Min(0)
  @IsInt()
  @Type(() => Number)
  uploadOffset!: number;
}

export class GetUploadStatusDto extends BaseRufhHeadersDto {}
