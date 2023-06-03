import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { toBoolean } from '../../../utils/transform.util';

export enum TimeGroupEnum {
  Day = 'day',
  Month = 'month',
}

export class GetAssetCountByTimeBucketDto {
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    enum: TimeGroupEnum,
    enumName: 'TimeGroupEnum',
  })
  timeGroup!: TimeGroupEnum;

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
