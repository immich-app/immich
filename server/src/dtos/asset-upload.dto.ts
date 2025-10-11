import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, plainToInstance, Transform, Type } from 'class-transformer';
import { Equals, IsInt, IsNotEmpty, IsString, Min, ValidateIf, ValidateNested } from 'class-validator';
import { ImmichHeader } from 'src/enum';
import { Optional, ValidateBoolean, ValidateDate } from 'src/validation';
import { parseDictionary } from 'structured-headers';

export enum Header {
  ContentLength = 'content-length',
  ContentType = 'content-type',
  InteropVersion = 'upload-draft-interop-version',
  ReprDigest = 'repr-digest',
  UploadComplete = 'upload-complete',
  UploadIncomplete = 'upload-incomplete',
  UploadLength = 'upload-length',
  UploadOffset = 'upload-offset',
}

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
  livePhotoVideoId?: string;

  @Optional()
  @IsString()
  @IsNotEmpty()
  iCloudId!: string;
}

class BaseRufhHeadersDto {
  @Expose({ name: Header.InteropVersion })
  @Min(3)
  @IsInt()
  @Type(() => Number)
  version!: number;
}

export class BaseUploadHeadersDto extends BaseRufhHeadersDto {
  @Expose({ name: Header.ContentLength })
  @Min(0)
  @IsInt()
  @Type(() => Number)
  contentLength!: number;

  @Expose()
  @Transform(({ obj }) => isUploadComplete(obj))
  uploadComplete!: boolean;
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
        livePhotoVideoId: dict.get('live-photo-video-id')?.[0],
        iCloudId: dict.get('icloud-id')?.[0],
      });
    } catch {
      throw new BadRequestException(`${ImmichHeader.AssetData} must be a valid structured dictionary`);
    }
  })
  assetData!: UploadAssetDataDto;

  @Expose({ name: Header.ReprDigest })
  @Transform(({ value }) => {
    if (!value) {
      throw new BadRequestException(`Missing ${Header.ReprDigest} header`);
    }

    const checksum = parseDictionary(value).get('sha')?.[0];
    if (checksum instanceof ArrayBuffer && checksum.byteLength === 20) {
      return Buffer.from(checksum);
    }
    throw new BadRequestException(`Invalid ${Header.ReprDigest} header`);
  })
  checksum!: Buffer;

  @Expose()
  @Min(1)
  @IsInt()
  @Transform(({ obj }) => {
    const uploadLength = obj[Header.UploadLength];
    if (uploadLength != undefined) {
      return Number(uploadLength);
    }

    const contentLength = obj[Header.ContentLength];
    if (contentLength && isUploadComplete(obj)) {
      return Number(contentLength);
    }
    throw new BadRequestException(`Missing ${Header.UploadLength} header`);
  })
  uploadLength!: number;
}

export class ResumeUploadDto extends BaseUploadHeadersDto {
  @Expose({ name: Header.ContentType })
  @ValidateIf((o) => o.version && o.version >= 6)
  @Equals('application/partial-upload')
  contentType!: string;

  @Expose({ name: Header.UploadLength })
  @Min(1)
  @IsInt()
  @Type(() => Number)
  @Optional()
  uploadLength?: number;

  @Expose({ name: Header.UploadOffset })
  @Min(0)
  @IsInt()
  @Type(() => Number)
  uploadOffset!: number;
}

export class GetUploadStatusDto extends BaseRufhHeadersDto {}

export class UploadOkDto {
  @ApiProperty()
  id!: string;
}

const STRUCTURED_TRUE = '?1';
const STRUCTURED_FALSE = '?0';

function isUploadComplete(obj: any): boolean {
  const uploadComplete = obj[Header.UploadComplete];
  if (uploadComplete === STRUCTURED_TRUE) {
    return true;
  } else if (uploadComplete === STRUCTURED_FALSE) {
    return false;
  }

  const uploadIncomplete = obj[Header.UploadIncomplete];
  if (uploadIncomplete === STRUCTURED_TRUE) {
    return false;
  } else if (uploadIncomplete === STRUCTURED_FALSE) {
    return true;
  }
  throw new BadRequestException(`Expected valid ${Header.UploadComplete} header`);
}
