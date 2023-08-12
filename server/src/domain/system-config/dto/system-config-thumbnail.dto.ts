import { toBoolean } from '@app/domain/domain.util';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt } from 'class-validator';

export class SystemConfigThumbnailDto {
  @IsInt()
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  webpSize!: number;

  @IsInt()
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  jpegSize!: number;

  @IsInt()
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  quality!: number;

  @IsBoolean()
  @Transform(toBoolean)
  @ApiProperty({ type: 'boolean' })
  wideGamut!: boolean;
}
