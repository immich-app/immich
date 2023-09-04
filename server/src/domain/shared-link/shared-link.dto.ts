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
  showExif?: boolean = true;
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
  showExif?: boolean;
}
