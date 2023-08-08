import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class SystemConfigThumbnailDto {
  @IsInt()
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  webpSize!: number;

  @IsInt()
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  jpegSize!: number;
}
