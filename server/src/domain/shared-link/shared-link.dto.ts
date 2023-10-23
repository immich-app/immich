import { SharedLinkType } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsString } from 'class-validator';
import { Optional, ValidateUUID } from '../domain.util';

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

  @IsDate()
  @Type(() => Date)
  @Optional({ nullable: true })
  expiresAt?: Date | null = null;

  @Optional()
  @IsBoolean()
  allowUpload?: boolean = false;

  @Optional()
  @IsBoolean()
  allowDownload?: boolean = true;

  @Optional()
  @IsBoolean()
  showMetadata?: boolean = true;
}

export class SharedLinkEditDto {
  @Optional()
  description?: string;

  @Optional({ nullable: true })
  expiresAt?: Date | null;

  @Optional()
  allowUpload?: boolean;

  @Optional()
  allowDownload?: boolean;

  @Optional()
  showMetadata?: boolean;

  /**
   * Few clients cannot send null to set the expiryTime to never.
   * Setting this flag and not sending expiryAt is considered as null instead.
   * Clients that can send null values can ignore this.
   */
  @Optional()
  @IsBoolean()
  changeExpiryTime?: boolean;
}
