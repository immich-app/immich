import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsObject, IsString, IsUUID, ValidateNested } from 'class-validator';
import { AssetMediaCreateDto } from 'src/dtos/asset-media.dto';

export enum TusdHookRequestType {
  PreCreate = 'pre-create',
  PreFinish = 'pre-finish',
}

export enum TusdHookStorageType {
  FileStore = 'filestore',
}

export class TusdStorageDto {
  @IsEnum(TusdHookStorageType)
  Type!: string;

  @IsString()
  @IsNotEmpty()
  Path!: string;

  @IsString()
  @IsNotEmpty()
  InfoPath!: string;
}

export class UploadAssetDataDto extends AssetMediaCreateDto {
  @IsString()
  @IsNotEmpty()
  declare filename: string;
}

export class TusdMetaDataDto {
  @IsString()
  @IsNotEmpty()
  declare AssetData: string; // base64-encoded JSON string of UploadAssetDataDto
}

export class TusdPreCreateUploadDto {
  @IsInt()
  Size!: number;
}

export class TusdPreFinishUploadDto {
  @IsUUID()
  ID!: string;

  @IsInt()
  Size!: number;

  @Type(() => TusdMetaDataDto)
  @ValidateNested()
  @IsObject()
  MetaData!: TusdMetaDataDto;

  @Type(() => TusdStorageDto)
  @ValidateNested()
  @IsObject()
  Storage!: TusdStorageDto;
}

export class TusdHttpRequestDto {
  @IsString()
  @IsNotEmpty()
  Method!: string;

  @IsString()
  @IsNotEmpty()
  URI!: string;

  @IsObject()
  Header!: Record<string, string[]>;
}

export class TusdPreCreateEventDto {
  @Type(() => TusdPreCreateUploadDto)
  @ValidateNested()
  @IsObject()
  Upload!: TusdPreCreateUploadDto;

  @Type(() => TusdHttpRequestDto)
  @ValidateNested()
  @IsObject()
  HTTPRequest!: TusdHttpRequestDto;
}

export class TusdPreFinishEventDto {
  @Type(() => TusdPreFinishUploadDto)
  @ValidateNested()
  @IsObject()
  Upload!: TusdPreFinishUploadDto;

  @Type(() => TusdHttpRequestDto)
  @ValidateNested()
  @IsObject()
  HTTPRequest!: TusdHttpRequestDto;
}

export class TusdHookRequestDto {
  @IsEnum(TusdHookRequestType)
  Type!: TusdHookRequestType;

  @IsObject()
  Event!: TusdPreCreateEventDto | TusdPreFinishEventDto;
}

export class TusdHttpResponseDto {
  StatusCode!: number;

  Body?: string;

  Header?: Record<string, string>;
}

export class TusdChangeFileInfoStorageDto {
  Path?: string;
}

export class TusdChangeFileInfoDto {
  ID?: string;

  MetaData?: TusdMetaDataDto;

  Storage?: TusdChangeFileInfoStorageDto;
}

export class TusdHookResponseDto {
  HTTPResponse?: TusdHttpResponseDto;

  RejectUpload?: boolean;

  ChangeFileInfo?: TusdChangeFileInfoDto;
}
