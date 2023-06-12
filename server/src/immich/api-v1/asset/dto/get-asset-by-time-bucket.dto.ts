import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { toBoolean } from '../../../utils/transform.util';

export class GetAssetByTimeBucketDto {
  @IsNotEmpty()
  @ApiProperty({
    isArray: true,
    type: String,
    title: 'Array of date time buckets',
    example: ['2015-06-01T00:00:00.000Z', '2016-02-01T00:00:00.000Z', '2016-03-01T00:00:00.000Z'],
  })
  timeBucket!: string[];

  @IsOptional()
  @IsUUID('4')
  @ApiProperty({ format: 'uuid' })
  userId?: string;

  /**
   * Include assets without thumbnails
   */
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  withoutThumbs?: boolean;
}
