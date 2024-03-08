import { SharedLinkType } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { Optional, ValidateBoolean, ValidateDate, ValidateUUID } from '../domain.util';

export class SharedLinkCreateDto {
  @IsEnum(SharedLinkType)
  @ApiProperty({ enum: SharedLinkType, enumName: 'SharedLinkType' })
  type!: SharedLinkType;

  @ValidateUUID({ each: true, optional: true })
  assetIds?: string[];

  @ValidateUUID({ optional: true })
  albumId?: string;

  @IsString()
  @Optional()
  description?: string;

  @IsString()
  @Optional()
  password?: string;

  @ValidateDate({ optional: true, nullable: true })
  expiresAt?: Date | null = null;

  @ValidateBoolean({ optional: true })
  allowUpload?: boolean;

  @ValidateBoolean({ optional: true })
  allowDownload?: boolean = true;

  @ValidateBoolean({ optional: true })
  showMetadata?: boolean = true;
}

export class SharedLinkEditDto {
  @Optional()
  description?: string;

  @Optional()
  password?: string;

  @Optional({ nullable: true })
  expiresAt?: Date | null;

  @Optional()
  allowUpload?: boolean;

  @ValidateBoolean({ optional: true })
  allowDownload?: boolean;

  @ValidateBoolean({ optional: true })
  showMetadata?: boolean;

  /**
   * Few clients cannot send null to set the expiryTime to never.
   * Setting this flag and not sending expiryAt is considered as null instead.
   * Clients that can send null values can ignore this.
   */
  @ValidateBoolean({ optional: true })
  changeExpiryTime?: boolean;
}

export class SharedLinkPasswordDto {
  @IsString()
  @Optional()
  @ApiProperty({ example: 'password' })
  password?: string;

  @IsString()
  @Optional()
  token?: string;
}
