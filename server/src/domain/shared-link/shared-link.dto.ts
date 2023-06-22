import { SharedLinkType } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { ValidateUUID } from '../../immich/decorators/validate-uuid.decorator';

export class SharedLinkCreateDto {
  @IsEnum(SharedLinkType)
  @ApiProperty({ enum: SharedLinkType, enumName: 'SharedLinkType' })
  type!: SharedLinkType;

  @ValidateUUID({ each: true, optional: true })
  assetIds?: string[];

  @ValidateUUID({ optional: true })
  albumId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDate()
  @IsOptional()
  expiresAt?: Date | null = null;

  @IsOptional()
  @IsBoolean()
  allowUpload?: boolean = false;

  @IsOptional()
  @IsBoolean()
  allowDownload?: boolean = true;

  @IsOptional()
  @IsBoolean()
  showExif?: boolean = true;
}

export class SharedLinkEditDto {
  @IsOptional()
  description?: string;

  @IsOptional()
  expiresAt?: Date | null;

  @IsOptional()
  allowUpload?: boolean;

  @IsOptional()
  allowDownload?: boolean;

  @IsOptional()
  showExif?: boolean;
}
