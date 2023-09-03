import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { toBoolean, ValidateUUID, Optional } from '../../domain.util';
import { TimeBucketSize } from '../asset.repository';

export class TimeBucketDto {
  @IsNotEmpty()
  @IsEnum(TimeBucketSize)
  @ApiProperty({ enum: TimeBucketSize, enumName: 'TimeBucketSize' })
  size!: TimeBucketSize;

  @ValidateUUID({ optional: true })
  userId?: string;

  @ValidateUUID({ optional: true })
  albumId?: string;

  @ValidateUUID({ optional: true })
  personId?: string;

  @Optional()
  @IsBoolean()
  @Transform(toBoolean)
  isArchived?: boolean;

  @Optional()
  @IsBoolean()
  @Transform(toBoolean)
  isFavorite?: boolean;
}

export class TimeBucketAssetDto extends TimeBucketDto {
  @IsString()
  @IsNotEmpty()
  timeBucket!: string;
}
