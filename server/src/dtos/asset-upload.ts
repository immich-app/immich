import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, plainToInstance, Transform, Type } from 'class-transformer';
import { Equals, IsEmpty, IsEnum, IsInt, IsNotEmpty, IsString, Min, ValidateIf, ValidateNested } from 'class-validator';
import { ImmichHeader } from 'src/enum';
import { Optional, ValidateBoolean, ValidateDate } from 'src/validation';
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

  @IsString()
  @IsNotEmpty()
  filename!: string;

  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @Optional()
  @IsString()
  @IsNotEmpty()
  iCloudId!: string;
}

export enum StructuredBoolean {
  False = '?0',
  True = '?1',
}

export enum UploadHeader {
  ContentLength = 'content-length',
  ContentType = 'content-type',
  InteropVersion = 'upload-draft-interop-version',
  ReprDigest = 'repr-digest',
  UploadComplete = 'upload-complete',
  UploadIncomplete = 'upload-incomplete',
  UploadLength = 'upload-length',
  UploadOffset = 'upload-offset',
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
  @ValidateIf((o) => o.version === null || o.version > 3)
  @IsEnum(StructuredBoolean)
  uploadComplete!: StructuredBoolean;

  @Expose({ name: UploadHeader.UploadIncomplete })
  @ValidateIf((o) => o.version !== null && o.version <= 3)
  @IsEnum(StructuredBoolean)
  uploadIncomplete!: StructuredBoolean;

  get isComplete(): boolean {
    if (this.version <= 3) {
      return this.uploadIncomplete === StructuredBoolean.False;
    }
    return this.uploadComplete === StructuredBoolean.True;
  }
}

export class StartUploadDto extends BaseUploadHeadersDto {
  @Expose({ name: ImmichHeader.AssetData })
  @ValidateNested()
  @Transform(({ value }) => {
    if (!value) {
      throw new BadRequestException(`${ImmichHeader.AssetData} header is required`);
    }

    try {
      const dict = parseDictionary(value);
      return plainToInstance(UploadAssetDataDto, {
        deviceAssetId: dict.get('device-asset-id')?.[0],
        deviceId: dict.get('device-id')?.[0],
        filename: dict.get('filename')?.[0],
        duration: dict.get('duration')?.[0],
        fileCreatedAt: dict.get('file-created-at')?.[0],
        fileModifiedAt: dict.get('file-modified-at')?.[0],
        isFavorite: dict.get('is-favorite')?.[0],
        iCloudId: dict.get('icloud-id')?.[0],
      });
    } catch {
      throw new BadRequestException(`${ImmichHeader.AssetData} must be a valid structured dictionary`);
    }
  })
  assetData!: UploadAssetDataDto;

  @Expose({ name: UploadHeader.ReprDigest })
  @Transform(({ value }) => {
    if (!value) {
      throw new BadRequestException(`Missing ${UploadHeader.ReprDigest} header`);
    }

    const checksum = parseDictionary(value).get('sha')?.[0];
    if (checksum instanceof ArrayBuffer && checksum.byteLength === 20) {
      return Buffer.from(checksum);
    }
    throw new BadRequestException(`Invalid ${UploadHeader.ReprDigest} header`);
  })
  checksum!: Buffer;

  @Expose({ name: UploadHeader.UploadLength })
  @Min(0)
  @IsInt()
  @Type(() => Number)
  uploadLength!: number;

  @Expose({ name: UploadHeader.UploadOffset })
  @IsEmpty()
  uploadOffset?: string;
}

export class ResumeUploadDto extends BaseUploadHeadersDto {
  @Expose({ name: UploadHeader.ContentType })
  @ValidateIf((o) => o.version && o.version >= 6)
  @Equals('application/partial-upload')
  contentType!: string;

  @Expose({ name: UploadHeader.UploadLength })
  @Min(0)
  @IsInt()
  @Type(() => Number)
  @Optional()
  uploadLength?: number;

  @Expose({ name: UploadHeader.UploadOffset })
  @Min(0)
  @IsInt()
  @Type(() => Number)
  uploadOffset!: number;
}

export class GetUploadStatusDto extends BaseRufhHeadersDto {
  @Expose({ name: UploadHeader.UploadComplete })
  @IsEmpty()
  uploadComplete?: string;

  @Expose({ name: UploadHeader.UploadIncomplete })
  @IsEmpty()
  uploadIncomplete?: string;

  @Expose({ name: UploadHeader.UploadOffset })
  @IsEmpty()
  uploadOffset?: string;
}

export class UploadOkDto {
  @ApiProperty()
  id!: string;
}
