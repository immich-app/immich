import { Colorspace } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, Max, Min } from 'class-validator';

export class SystemConfigThumbnailDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  webpSize!: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  jpegSize!: number;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  quality!: number;

  @IsEnum(Colorspace)
  @ApiProperty({ enumName: 'Colorspace', enum: Colorspace })
  colorspace!: Colorspace;
}
