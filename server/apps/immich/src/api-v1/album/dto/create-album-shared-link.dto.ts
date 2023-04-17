import { ApiProperty } from '@nestjs/swagger';
import { ValidateUUID } from 'apps/immich/src/decorators/validate-uuid.decorator';
import { IsBoolean, IsISO8601, IsOptional, IsString } from 'class-validator';

export class CreateAlbumShareLinkDto {
  @ValidateUUID()
  albumId!: string;

  @IsISO8601()
  @IsOptional()
  @ApiProperty({ format: 'date-time' })
  expiresAt?: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty()
  allowUpload?: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiProperty()
  allowDownload?: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiProperty()
  showExif?: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty()
  description?: string;
}
